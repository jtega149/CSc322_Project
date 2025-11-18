# API Examples for Firebase Integration

This document provides example code for common operations in the AI Restaurant system.

## 🔐 Authentication Operations

### Register New Customer
```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

async function registerCustomer(email: string, password: string, name: string) {
  // Create auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user document
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email,
    name,
    role: 'visitor', // Needs manager approval to become 'customer'
    createdAt: new Date(),
    accountBalance: 0,
    totalSpent: 0,
    orderCount: 0,
    isBlacklisted: false,
    freeDeliveriesEarned: 0,
    freeDeliveriesUsed: 0
  });
  
  return userCredential.user;
}
```

### Login
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

async function login(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
```

## 🍽️ Menu Operations

### Get All Dishes
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

async function getAvailableDishes(isVIP: boolean) {
  const dishesRef = collection(db, 'dishes');
  
  let q;
  if (isVIP) {
    // VIP can see all dishes
    q = query(dishesRef, where('isAvailable', '==', true));
  } else {
    // Regular customers only see non-VIP dishes
    q = query(
      dishesRef,
      where('isAvailable', '==', true),
      where('isVIPOnly', '==', false)
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Create Dish (Chef)
```typescript
import { collection, addDoc } from 'firebase/firestore';

async function createDish(chefId: string, dishData: {
  name: string;
  description: string;
  price: number;
  category: string;
  isVIPOnly: boolean;
  imageFile?: File;
}) {
  let imageUrl = '';
  
  // Upload image if provided
  if (dishData.imageFile) {
    const storageRef = ref(storage, `dishes/${Date.now()}_${dishData.imageFile.name}`);
    await uploadBytes(storageRef, dishData.imageFile);
    imageUrl = await getDownloadURL(storageRef);
  }
  
  const dishRef = await addDoc(collection(db, 'dishes'), {
    name: dishData.name,
    description: dishData.description,
    price: dishData.price,
    category: dishData.category,
    isVIPOnly: dishData.isVIPOnly,
    imageUrl,
    chefId,
    isAvailable: true,
    averageRating: 0,
    orderCount: 0,
    createdAt: new Date()
  });
  
  return dishRef.id;
}
```

## 🛒 Order Operations

### Create Order
```typescript
import { runTransaction } from 'firebase/firestore';

async function createOrder(
  customerId: string,
  items: Array<{ dishId: string; quantity: number; price: number }>,
  deliveryFee: number,
  useFreeDelivery: boolean
) {
  return await runTransaction(db, async (transaction) => {
    // Get customer data
    const customerRef = doc(db, 'users', customerId);
    const customerDoc = await transaction.get(customerRef);
    const customer = customerDoc.data();
    
    if (!customer) throw new Error('Customer not found');
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = customer.role === 'vip' ? subtotal * 0.05 : 0;
    const finalDeliveryFee = useFreeDelivery ? 0 : deliveryFee;
    const total = subtotal - discount + finalDeliveryFee;
    
    // Check balance
    if (customer.accountBalance < total) {
      // Add warning for insufficient funds
      await addDoc(collection(db, 'warnings'), {
        userId: customerId,
        reason: 'Attempted order with insufficient funds',
        issuedAt: new Date()
      });
      throw new Error('Insufficient balance');
    }
    
    // Create order
    const orderRef = await addDoc(collection(db, 'orders'), {
      customerId,
      items,
      totalPrice: subtotal,
      deliveryFee: finalDeliveryFee,
      discount,
      finalPrice: total,
      status: 'pending',
      deliveryBids: [],
      createdAt: new Date()
    });
    
    // Update customer
    transaction.update(customerRef, {
      accountBalance: customer.accountBalance - total,
      totalSpent: (customer.totalSpent || 0) + total,
      orderCount: (customer.orderCount || 0) + 1,
      freeDeliveriesUsed: useFreeDelivery ? (customer.freeDeliveriesUsed || 0) + 1 : customer.freeDeliveriesUsed
    });
    
    // Update dish order counts
    for (const item of items) {
      const dishRef = doc(db, 'dishes', item.dishId);
      const dishDoc = await transaction.get(dishRef);
      transaction.update(dishRef, {
        orderCount: (dishDoc.data()?.orderCount || 0) + item.quantity
      });
    }
    
    // Create transaction record
    await addDoc(collection(db, 'transactions'), {
      userId: customerId,
      type: 'order',
      amount: -total,
      balanceBefore: customer.accountBalance,
      balanceAfter: customer.accountBalance - total,
      orderId: orderRef.id,
      description: `Order #${orderRef.id}`,
      timestamp: new Date()
    });
    
    // Check for VIP qualification
    const newTotalSpent = (customer.totalSpent || 0) + total;
    const newOrderCount = (customer.orderCount || 0) + 1;
    const hasNoWarnings = !customer.warnings || customer.warnings.length === 0;
    
    if (customer.role === 'customer' && hasNoWarnings && 
        (newTotalSpent >= 100 || newOrderCount >= 3)) {
      transaction.update(customerRef, {
        role: 'vip',
        freeDeliveriesEarned: Math.floor(newOrderCount / 3)
      });
    }
    
    return orderRef.id;
  });
}
```

### Submit Delivery Bid
```typescript
async function submitDeliveryBid(orderId: string, deliveryPersonId: string, bidAmount: number) {
  const bidRef = await addDoc(collection(db, 'deliveryBids'), {
    orderId,
    deliveryPersonId,
    bidAmount,
    timestamp: new Date()
  });
  
  // Update order with new bid
  const orderRef = doc(db, 'orders', orderId);
  const orderDoc = await getDoc(orderRef);
  const currentBids = orderDoc.data()?.deliveryBids || [];
  
  await updateDoc(orderRef, {
    deliveryBids: [...currentBids, {
      bidId: bidRef.id,
      deliveryPersonId,
      bidAmount,
      timestamp: new Date()
    }]
  });
  
  return bidRef.id;
}
```

### Assign Delivery (Manager)
```typescript
async function assignDelivery(
  orderId: string,
  deliveryPersonId: string,
  managerId: string,
  memo?: string
) {
  const orderRef = doc(db, 'orders', orderId);
  
  await updateDoc(orderRef, {
    deliveryPersonId,
    status: 'preparing'
  });
  
  // If not the lowest bid, manager must provide memo
  const orderDoc = await getDoc(orderRef);
  const bids = orderDoc.data()?.deliveryBids || [];
  const lowestBid = bids.reduce((min, bid) => 
    bid.bidAmount < min.bidAmount ? bid : min
  );
  
  if (lowestBid.deliveryPersonId !== deliveryPersonId && !memo) {
    throw new Error('Manager must provide justification for not choosing lowest bid');
  }
  
  if (memo) {
    await addDoc(collection(db, 'hrActions'), {
      managerId,
      targetId: deliveryPersonId,
      actionType: 'memo',
      reason: 'Delivery assignment',
      memo,
      timestamp: new Date()
    });
  }
}
```

## ⭐ Rating Operations

### Submit Rating
```typescript
async function submitRating(
  userId: string,
  orderId: string,
  dishId: string,
  deliveryPersonId: string,
  foodRating: number,
  deliveryRating: number,
  comment?: string
) {
  // Create rating
  await addDoc(collection(db, 'ratings'), {
    userId,
    orderId,
    dishId,
    deliveryPersonId,
    foodRating,
    deliveryRating,
    comment,
    createdAt: new Date()
  });
  
  // Update dish average rating
  const ratingsQuery = query(
    collection(db, 'ratings'),
    where('dishId', '==', dishId)
  );
  const ratingsSnapshot = await getDocs(ratingsQuery);
  const avgRating = ratingsSnapshot.docs.reduce((sum, doc) => 
    sum + doc.data().foodRating, 0
  ) / ratingsSnapshot.docs.length;
  
  await updateDoc(doc(db, 'dishes', dishId), {
    averageRating: avgRating
  });
  
  // Update delivery person average rating
  const deliveryRatingsQuery = query(
    collection(db, 'ratings'),
    where('deliveryPersonId', '==', deliveryPersonId)
  );
  const deliveryRatingsSnapshot = await getDocs(deliveryRatingsQuery);
  const avgDeliveryRating = deliveryRatingsSnapshot.docs.reduce((sum, doc) => 
    sum + doc.data().deliveryRating, 0
  ) / deliveryRatingsSnapshot.docs.length;
  
  await updateDoc(doc(db, 'users', deliveryPersonId), {
    averageRating: avgDeliveryRating
  });
}
```

## 📢 Complaint Operations

### File Complaint/Compliment
```typescript
async function fileComplaint(
  reporterId: string,
  targetId: string,
  targetType: 'chef' | 'delivery' | 'customer',
  type: 'complaint' | 'compliment',
  reason: string,
  orderId?: string
) {
  // Get reporter to determine weight
  const reporterDoc = await getDoc(doc(db, 'users', reporterId));
  const weight = reporterDoc.data()?.role === 'vip' ? 2 : 1;
  
  const complaintRef = await addDoc(collection(db, 'complaints'), {
    type,
    reporterId,
    targetId,
    targetType,
    orderId,
    reason,
    status: 'pending',
    isDisputed: false,
    weight,
    createdAt: new Date()
  });
  
  return complaintRef.id;
}
```

### Resolve Complaint (Manager)
```typescript
async function resolveComplaint(
  complaintId: string,
  managerId: string,
  isValid: boolean,
  managerNotes: string
) {
  const complaintRef = doc(db, 'complaints', complaintId);
  const complaintDoc = await getDoc(complaintRef);
  const complaint = complaintDoc.data();
  
  if (!complaint) throw new Error('Complaint not found');
  
  await updateDoc(complaintRef, {
    status: isValid ? 'resolved_valid' : 'resolved_invalid',
    managerNotes,
    resolvedAt: new Date()
  });
  
  if (isValid && complaint.type === 'complaint') {
    // Add warning to target
    await addDoc(collection(db, 'warnings'), {
      userId: complaint.targetId,
      reason: `Complaint: ${complaint.reason}`,
      issuedAt: new Date(),
      relatedComplaintId: complaintId
    });
    
    // Check warning count and take action
    const warningsQuery = query(
      collection(db, 'warnings'),
      where('userId', '==', complaint.targetId)
    );
    const warningsSnapshot = await getDocs(warningsQuery);
    const warningCount = warningsSnapshot.docs.length;
    
    const targetRef = doc(db, 'users', complaint.targetId);
    const targetDoc = await getDoc(targetRef);
    const target = targetDoc.data();
    
    if (target?.role === 'customer' && warningCount >= 3) {
      // Deregister customer
      await updateDoc(targetRef, {
        role: 'visitor',
        isBlacklisted: true
      });
    } else if (target?.role === 'vip' && warningCount >= 2) {
      // Downgrade to regular customer
      await updateDoc(targetRef, {
        role: 'customer'
      });
      // Clear warnings
      for (const doc of warningsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
    }
  } else if (!isValid) {
    // Add warning to reporter for false complaint
    await addDoc(collection(db, 'warnings'), {
      userId: complaint.reporterId,
      reason: 'Filed complaint without merit',
      issuedAt: new Date(),
      relatedComplaintId: complaintId
    });
  }
}
```

## 💬 Discussion Forum Operations

### Create Discussion Topic
```typescript
async function createDiscussionTopic(
  authorId: string,
  title: string,
  content: string,
  category: 'chef' | 'dish' | 'delivery' | 'general',
  relatedId?: string
) {
  const topicRef = await addDoc(collection(db, 'discussions'), {
    authorId,
    title,
    content,
    category,
    relatedId,
    createdAt: new Date()
  });
  
  return topicRef.id;
}
```

### Add Post to Topic
```typescript
async function addPostToTopic(
  topicId: string,
  authorId: string,
  content: string
) {
  const postRef = await addDoc(
    collection(db, 'discussions', topicId, 'posts'),
    {
      authorId,
      content,
      createdAt: new Date()
    }
  );
  
  return postRef.id;
}
```

## 🤖 AI Chat Operations

### Get AI Response
```typescript
import { httpsCallable } from 'firebase/functions';

async function getAIResponse(question: string) {
  const getLLMResponse = httpsCallable(functions, 'getLLMResponse');
  const result = await getLLMResponse({ question });
  return result.data;
}
```

### Rate Knowledge Base Answer
```typescript
async function rateKBAnswer(entryId: string, rating: number) {
  const entryRef = doc(db, 'knowledgeBase', entryId);
  const entryDoc = await getDoc(entryRef);
  const entry = entryDoc.data();
  
  if (!entry) throw new Error('Entry not found');
  
  const newRatingCount = (entry.ratingCount || 0) + 1;
  const newRating = ((entry.rating || 0) * (entry.ratingCount || 0) + rating) / newRatingCount;
  
  await updateDoc(entryRef, {
    rating: newRating,
    ratingCount: newRatingCount,
    isFlagged: rating === 0 ? true : entry.isFlagged
  });
}
```

## 💰 Finance Operations

### Deposit Funds
```typescript
async function depositFunds(userId: string, amount: number) {
  return await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await transaction.get(userRef);
    const user = userDoc.data();
    
    if (!user) throw new Error('User not found');
    
    const newBalance = (user.accountBalance || 0) + amount;
    
    transaction.update(userRef, {
      accountBalance: newBalance
    });
    
    // Create transaction record
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'deposit',
      amount,
      balanceBefore: user.accountBalance || 0,
      balanceAfter: newBalance,
      description: 'Account deposit',
      timestamp: new Date()
    });
    
    return newBalance;
  });
}
```

## 👔 HR Operations (Manager)

### Adjust Salary
```typescript
async function adjustSalary(
  managerId: string,
  employeeId: string,
  newSalary: number,
  actionType: 'raise' | 'cut_pay' | 'bonus',
  reason: string
) {
  const employeeRef = doc(db, 'users', employeeId);
  const employeeDoc = await getDoc(employeeRef);
  const employee = employeeDoc.data();
  
  if (!employee) throw new Error('Employee not found');
  
  await updateDoc(employeeRef, {
    salary: newSalary
  });
  
  await addDoc(collection(db, 'hrActions'), {
    managerId,
    targetId: employeeId,
    actionType,
    previousSalary: employee.salary,
    newSalary,
    reason,
    timestamp: new Date()
  });
}
```

### Fire Employee
```typescript
async function fireEmployee(
  managerId: string,
  employeeId: string,
  reason: string
) {
  const employeeRef = doc(db, 'users', employeeId);
  
  await updateDoc(employeeRef, {
    status: 'fired',
    role: 'visitor'
  });
  
  await addDoc(collection(db, 'hrActions'), {
    managerId,
    targetId: employeeId,
    actionType: 'fire',
    reason,
    timestamp: new Date()
  });
}
```

## 📊 Real-time Listeners

### Listen to Order Updates
```typescript
import { onSnapshot } from 'firebase/firestore';

function subscribeToOrderUpdates(orderId: string, callback: (order: any) => void) {
  const orderRef = doc(db, 'orders', orderId);
  
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
}

// Usage
const unsubscribe = subscribeToOrderUpdates('order123', (order) => {
  console.log('Order updated:', order.status);
});

// Cleanup
unsubscribe();
```

### Listen to New Complaints (Manager)
```typescript
function subscribeToNewComplaints(callback: (complaint: any) => void) {
  const complaintsQuery = query(
    collection(db, 'complaints'),
    where('status', '==', 'pending')
  );
  
  return onSnapshot(complaintsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback({ id: change.doc.id, ...change.doc.data() });
      }
    });
  });
}
```

## 🔍 Advanced Queries

### Get Top Performing Dishes
```typescript
async function getTopDishes(limit: number = 10) {
  const dishesQuery = query(
    collection(db, 'dishes'),
    where('isAvailable', '==', true),
    orderBy('averageRating', 'desc'),
    limit(limit)
  );
  
  const snapshot = await getDocs(dishesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Get Customer Order History
```typescript
async function getCustomerOrderHistory(customerId: string) {
  const ordersQuery = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(ordersQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

This covers most common operations. Adapt these examples to fit your specific implementation needs!
