// src/userService.ts
/*
    User Service Module
    This module handles user authentication and registration
    using Firebase Authentication and Firestore.
*/

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getAuth
} from 'firebase/auth';

import { collection, doc, getDoc, query, setDoc, where, getDocs, deleteDoc, addDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { shouldBeVIP } from './lib/utils';
import type { Customer, KnowledgeBaseEntry, Order } from './types';

// Login user with email and password
export async function logInUser(email: string, password: string) {
    try {
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        return userCredential.user;
    } catch (error: any) {
        console.log("Error logging in:", error.message);
        throw new Error(error.message);
    }
}

// Sign Up user with email, password, name, and role, will check role for manager approval
export async function signUpUser(email: string, password: string, name: string, role: string) {
    try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional user info in Firestore
        const userData: any = {
            name,
            email,
            role,
            createdAt: new Date()
        };

        // If registering as a customer, add customer-specific fields
        if (role === 'customer' || role === 'visitor') {
            userData.accountBalance = 0;
            userData.totalSpent = 0;
            userData.orderCount = 0;
            userData.warnings = [];
            userData.orderHistory = [];
            userData.favorites = [];
            userData.isBlacklisted = false;
            userData.freeDeliveriesEarned = 0;
            userData.freeDeliveriesUsed = 0;
            userData.isVIP = false;
        }

        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('User signed up:', user);
        return user;
    } catch (error: any) {
        console.log("Error signing up:", error.message);
        throw new Error(error.message);
    }
}

// Logout current user
export async function logOutUser() {
    try {
        const auth = getAuth();
        await signOut(auth);
        console.log('User logged out');
    } catch (error: any) {
        console.log("Error logging out:", error.message);
        throw new Error(error.message);
    }
}

// Get all registrations
export async function getRegistrations(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found.');
        }
        const currentUser = userSnap.data();
        if (currentUser.role !== 'manager') {
            throw new Error('Access denied. Only managers can view registrations.');
        }
        
        // Getting all users with role of "visitor"
        const usersRef = collection(db, 'users'); // reference to users collection
        const q = query(usersRef, where('role', '==', 'visitor')); // query for where role === visitors
        const querySnapshot = await getDocs(q); // get all documents based on that query above

        // Visitors is an array of visitor objects
        const visitors = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Visitor registrations:', visitors);
        return visitors;
    } catch (error: any) {
        console.log("Error getting registrations:", error.message);
        throw new Error(error.message);
    }
}

// Update user function to update any user field given userId and data object
export async function updateUser(userId: string, data: any) {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, data, { merge: true });
        console.log('User updated:', userId);
    } catch (error: any) {
        console.log("Error updating user:", error.message);
        throw new Error(error.message);
    }
}

// Deposit funds to customer account
export async function depositFunds(userId: string, amount: number) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            throw new Error('User not found.');
        }
        
        const userData = userSnap.data();
        const currentBalance = userData.accountBalance || 0;
        const newBalance = currentBalance + amount;
        
        await setDoc(userRef, { 
            accountBalance: newBalance 
        }, { merge: true });
        
        console.log(`Deposited $${amount} to account. New balance: $${newBalance}`);
        return newBalance;
    } catch (error: any) {
        console.log("Error depositing funds:", error.message);
        throw new Error(error.message);
    }
}

// Function get all users with role of "Customer"
export async function getAllCustomers(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found.');
        }
        const currentUser = userSnap.data();
        if (currentUser.role !== 'manager') {
            throw new Error('Access denied. Only managers can view all customers.');
        }
        
        // Getting all users with role of "visitor"
        const usersRef = collection(db, 'users'); // reference to users collection
        const q = query(usersRef, where('role', '==', 'customer')); // query for where role === visitors
        const querySnapshot = await getDocs(q); // get all documents based on that query above

        // Customers is an array of visitor objects
        const customers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('All customers:', customers);
        return customers;
    } catch (error: any) {
        console.log("Error getting Customers:", error.message);
        throw new Error(error.message);
    }
}

// Function to make register as employee
export async function registerAsEmployee(email: string, password: string, name: string, role: string) {
    
}

// Get all chefs (public - for visitors and customers)
export async function getPublicChefs() {
    try {
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('role', '==', 'chef'));
        const querySnapshot = await getDocs(q);

        const chefs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email || '',
                role: 'chef',
                name: data.name || '',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                salary: data.salary || 0,
                hireDate: data.hireDate?.toDate ? data.hireDate.toDate() : new Date(data.hireDate),
                complaints: data.complaints || [],
                compliments: data.compliments || [],
                status: data.status || 'active',
                specialties: data.specialties || [],
                dishes: data.dishes || [],
                averageRating: data.averageRating || 0
            };
        });

        return chefs;
    } catch (error: any) {
        console.error("Error getting public chefs:", error.message);
        // Return empty array on error (e.g., permission denied for visitors)
        return [];
    }
}

// Function to get all chef employees (manager only)
export async function getAllChefs(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found.');
        }
        const currentUser = userSnap.data();
        if (currentUser.role !== 'manager') {
            throw new Error('Access denied. Only managers can view all chefs.');
        }
        
        // Getting all users with role of "chef"
        const usersRef = collection(db, 'employees'); // reference to users collection
        const q = query(usersRef, where('role', '==', 'chef')); // query for where role === chef
        const querySnapshot = await getDocs(q); // get all documents based on that query above

        // Chefs is an array of chef objects
        const chefs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('All chefs:', chefs);
        return chefs;
    } catch (error: any) {
        console.log("Error getting Chefs:", error.message);
        throw new Error(error.message);
    }
}

//Function to get all delivery employees
export async function getAllDeliveryEmployees(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found.');
        }
        const currentUser = userSnap.data();
        if (currentUser.role !== 'manager') {
            throw new Error('Access denied. Only managers can view all delivery employees.');
        }
        
        // Getting all users with role of "delivery"
        const usersRef = collection(db, 'employees'); // reference to users collection
        const q = query(usersRef, where('role', '==', 'delivery')); // query for where role === delivery
        const querySnapshot = await getDocs(q); // get all documents based on that query above

        // Delivery employees is an array of delivery employee objects
        const deliveryEmployees = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('All delivery employees:', deliveryEmployees);
        return deliveryEmployees;
    } catch (error: any) {
        console.log("Error getting Delivery Employees:", error.message);
        throw new Error(error.message);
    }
}

// Function to place all employee registrations somewhere idk
// Sign Up user with email, password, name, and role, will check role for manager approval
export async function signUpEmployee(email: string, password: string, name: string, role: string, specialties: string) {
    try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // FIGURE OUT WHAT TO DO WHEN EMPLOYEE APPLIED AND IF HE CAN NAVIGATE PAGE OR NOT
        // THINKING ABOUT JUST MAKING BRO A VISITOR FOR NOW

        // Save additional employee info in Firestore
        await setDoc(doc(db, 'employee_apps', user.uid), {
            name,
            email,
            desired_role: role,
            specialties,
            createdAt: new Date()
        });
        console.log('User signed up:', user);
        return user;
    } catch (error: any) {
        console.log("Error signing up:", error.message);
        throw new Error(error.message);
    }
}

export async function getEmployeeApplications(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found.');
        }
        const currentUser = userSnap.data();
        if (currentUser.role !== 'manager') {
            throw new Error('Access denied. Only managers can view employee applications.');
        }
        
        // Getting all documents from employee_apps collection
        const appsRef = collection(db, 'employee_apps'); // reference to employee_apps collection
        const querySnapshot = await getDocs(appsRef); // get all documents

        // Applications is an array of application objects
        const applications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Employee applications:', applications);
        return applications;
    } catch (error: any) {
        console.log("Error getting employee applications:", error.message);
        throw new Error(error.message);
    }
}

export async function hireEmployee(userId: string) {
    try {
        const appRef = doc(db, 'employee_apps', userId)
        console.log("testing hire id: ", userId)
        const appSnap = await getDoc(appRef)
        if (!appSnap.exists()) {
            throw new Error("Error in finding application")
        }
        const currentData = appSnap.data()
        if (currentData.desired_role === 'chef'){
            await setDoc(doc(db, 'employees', userId), {
                id: userId,
                email: currentData.email,
                role: 'chef',
                name: currentData.name,
                createdAt: currentData.createdAt,
                salary: 65000,
                hireDate: new Date(),
                complaints: [],
                compliments: [],
                status: 'active',
                demotionCount: 0,
                warnings: [],
                specialties: currentData.specialties,
                dishes: [],
                averageRating: 0

            })
        }
        else if (currentData.desired_role === "delivery"){
            await setDoc(doc(db, 'employees', userId), {
                id: userId,
                email: currentData.email,
                role: 'delivery',
                name: currentData.name,
                createdAt: currentData.createdAt,
                salary: 65000,
                hireDate: new Date(),
                complaints: [],
                compliments: [],
                status: 'active',
                demotionCount: 0,
                warnings: [],
                deliveryCount: 0,
                averageRating: 0,
                currentLocation: 'Downtown'

            })
        }
        else {
            throw new Error("Not a valid role or something occured fam")
        }
        // Delete the application from the employee applications collection
        await deleteDoc(appRef)
        console.log("Employee hired successfully")

    } catch (error){
        console.error("In Hire employye: ", error)
    }
}
export async function rejectEmployee(userId: string) {
    try {
        const appRef = doc(db, 'employee_apps', userId)
        // Kicking this dude out from the employee applications collection
        await deleteDoc(appRef)
    } catch (error) {
        console.error("ERROR hiring:", error)
    }
}

// Update employee salary
export async function updateEmployeeSalary(employeeId: string, newSalary: number, managerId: string) {
    try {
        const employeeRef = doc(db, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        
        if (!employeeSnap.exists()) {
            throw new Error('Employee not found');
        }
        
        const employeeData = employeeSnap.data();
        const previousSalary = employeeData.salary || 0;
        
        await updateDoc(employeeRef, {
            salary: newSalary
        });
        
        console.log(`Employee ${employeeId} salary updated from ${previousSalary} to ${newSalary} by manager ${managerId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating employee salary:", error.message);
        throw new Error(error.message);
    }
}

// Fire an employee (set status to inactive)
export async function fireEmployee(employeeId: string, managerId: string) {
    try {
        const employeeRef = doc(db, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        
        if (!employeeSnap.exists()) {
            throw new Error('Employee not found');
        }
        
        const employeeData = employeeSnap.data();
        const role = employeeData.role;
        
        // If it's a chef, delete all their dishes
        if (role === 'chef') {
            const dishesRef = collection(db, 'dishes');
            const q = query(dishesRef, where('chefId', '==', employeeId));
            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map(dishDoc => deleteDoc(doc(db, 'dishes', dishDoc.id)));
            await Promise.all(deletePromises);
            console.log(`Deleted ${querySnapshot.docs.length} dishes for fired chef ${employeeId}`);
        }
        
        await updateDoc(employeeRef, {
            status: 'inactive'
        });
        
        console.log(`Employee ${employeeId} fired by manager ${managerId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error firing employee:", error.message);
        throw new Error(error.message);
    }
}

// Get count of active employees by role
export async function getActiveEmployeeCount(role: 'chef' | 'delivery'): Promise<number> {
    try {
        const employeesRef = collection(db, 'employees');
        const q = query(
            employeesRef,
            where('role', '==', role),
            where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error: any) {
        console.error("Error getting active employee count:", error.message);
        throw new Error(error.message);
    }
}

// Create a new order and update customer information
export async function createOrder(
    customerId: string,
    items: { dishId: string; quantity: number; price: number }[],
    subtotal: number,
    deliveryFee: number,
    discount: number,
    finalPrice: number,
    tipAmount: number,
    deliveryInfo: {
        streetAddress: string;
        city: string;
        state: string;
        zipCode: string;
        phoneNumber: string;
        deliveryInstructions?: string;
    }
) {
    try {
        // Get customer document to check balance and get current values
        const userRef = doc(db, 'users', customerId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            throw new Error('Customer not found.');
        }
        
        const customerData = userSnap.data();
        const currentBalance = customerData.accountBalance || 0;
        const totalWithTip = finalPrice + tipAmount;
        
        // Check if customer has sufficient balance
        if (currentBalance < totalWithTip) {
            throw new Error('Insufficient balance.');
        }

        // Create order document
        const orderData = {
            customerId,
            items,
            totalPrice: subtotal,
            deliveryFee,
            discount,
            tipAmount,
            finalPrice: totalWithTip,
            status: 'pending',
            deliveryBids: [],
            deliveryInfo,
            createdAt: new Date(),
            orderCount: items.reduce((sum, item) => sum + item.quantity, 0)
        };

        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        const orderId = orderRef.id;

        // Update customer document
        const currentOrderHistory = customerData.orderHistory || [];
        const currentTotalSpent = customerData.totalSpent || 0;
        const currentOrderCount = customerData.orderCount || 0;
        const currentFreeDeliveriesUsed = customerData.freeDeliveriesUsed || 0;
        const currentFreeDeliveriesEarned = customerData.freeDeliveriesEarned || 0;
        const currentWarnings = customerData.warnings || [];
        const currentIsVIP = customerData.isVIP || false;
        
        // Calculate new values after this order
        const newTotalSpent = currentTotalSpent + totalWithTip;
        const newOrderCount = currentOrderCount + 1;
        
        // Check if free delivery was used
        const usedFreeDelivery = deliveryFee === 0 && currentFreeDeliveriesEarned > currentFreeDeliveriesUsed;
        
        // Create customer object to check VIP eligibility
        const customerForCheck: Customer = {
            id: customerId,
            email: customerData.email,
            name: customerData.name,
            createdAt: customerData.createdAt?.toDate ? customerData.createdAt.toDate() : new Date(customerData.createdAt),
            role: 'customer',
            isVIP: currentIsVIP,
            accountBalance: currentBalance - totalWithTip,
            totalSpent: newTotalSpent,
            orderCount: newOrderCount,
            warnings: currentWarnings,
            orderHistory: [...currentOrderHistory, orderId],
            favorites: customerData.favorites || [],
            isBlacklisted: customerData.isBlacklisted || false,
            freeDeliveriesEarned: currentFreeDeliveriesEarned,
            freeDeliveriesUsed: usedFreeDelivery ? currentFreeDeliveriesUsed + 1 : currentFreeDeliveriesUsed
        };
        
        // Check if customer should be promoted to VIP
        const shouldPromoteToVIP = shouldBeVIP(customerForCheck) && !currentIsVIP;
        
        // Calculate free deliveries earned (1 free delivery per 3 orders for VIP customers)
        // If customer is already VIP or will be promoted, award free deliveries
        let newFreeDeliveriesEarned = currentFreeDeliveriesEarned;
        if (currentIsVIP || shouldPromoteToVIP) {
            // Calculate how many free deliveries should be earned based on order count
            const freeDeliveriesShouldHave = Math.floor(newOrderCount / 3);
            newFreeDeliveriesEarned = freeDeliveriesShouldHave;
        }
        
        // Prepare update object
        const updateData: any = {
            accountBalance: currentBalance - totalWithTip,
            totalSpent: newTotalSpent,
            orderCount: newOrderCount,
            orderHistory: [...currentOrderHistory, orderId],
            freeDeliveriesEarned: newFreeDeliveriesEarned
        };
        
        // Update free deliveries used if free delivery was used
        if (usedFreeDelivery) {
            updateData.freeDeliveriesUsed = currentFreeDeliveriesUsed + 1;
        }
        
        // Promote to VIP if eligible
        if (shouldPromoteToVIP) {
            updateData.isVIP = true;
            console.log(`Customer ${customerId} promoted to VIP status`);
        }
        
        // Actually update the customer document in Firestore
        await updateDoc(userRef, updateData);
        
        console.log(`Order ${orderId} created successfully for customer ${customerId}`);
        return orderId;
        
    } catch (error: any) {
        console.log("Error creating order:", error.message);
        throw new Error(error.message);
    }
}

// Get all dishes from Firestore
export async function getAllDishes() {
    try {
        const dishesRef = collection(db, 'dishes');
        const querySnapshot = await getDocs(dishesRef);
        const dishes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                price: data.price || 0,
                imageUrl: data.imageUrl || '',
                chefId: data.chefId || '',
                category: data.category || '',
                isVIPOnly: data.isVIPOnly || false,
                isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
                ratings: data.ratings || [],
                averageRating: data.averageRating || 0,
                orderCount: data.orderCount || 0,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
            };
        });
        return dishes;
    } catch (error: any) {
        console.error("Error getting all dishes:", error.message);
        throw new Error(error.message);
    }
}

// Get dish by ID from Firestore
export async function getDishById(dishId: string) {
    try {
        const dishRef = doc(db, 'dishes', dishId);
        const dishSnap = await getDoc(dishRef);
        if (dishSnap.exists()) {
            const data = dishSnap.data();
            return {
                id: dishSnap.id,
                name: data.name || '',
                description: data.description || '',
                price: data.price || 0,
                imageUrl: data.imageUrl || '',
                chefId: data.chefId || '',
                category: data.category || '',
                isVIPOnly: data.isVIPOnly || false,
                isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
                ratings: data.ratings || [],
                averageRating: data.averageRating || 0,
                orderCount: data.orderCount || 0,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
            };
        }
        return null;
    } catch (error: any) {
        console.error("Error fetching dish by ID:", error.message);
        throw new Error(error.message);
    }
}

// Get dishes by chef ID
export async function getDishesByChefId(chefId: string) {
    try {
        const dishesRef = collection(db, 'dishes');
        const q = query(dishesRef, where('chefId', '==', chefId));
        const querySnapshot = await getDocs(q);
        const dishes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                price: data.price || 0,
                imageUrl: data.imageUrl || '',
                chefId: data.chefId || '',
                category: data.category || '',
                isVIPOnly: data.isVIPOnly || false,
                isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
                ratings: data.ratings || [],
                averageRating: data.averageRating || 0,
                orderCount: data.orderCount || 0,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
            };
        });
        return dishes;
    } catch (error: any) {
        console.error("Error getting dishes by chef ID:", error.message);
        throw new Error(error.message);
    }
}

// Get all pending orders
export async function getPendingOrders(): Promise<Order[]> {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                customerId: data.customerId || '',
                items: data.items || [],
                totalPrice: data.totalPrice || 0,
                deliveryFee: data.deliveryFee || 0,
                discount: data.discount || 0,
                finalPrice: data.finalPrice || 0,
                status: data.status || 'pending',
                chefId: data.chefId,
                deliveryPersonId: data.deliveryPersonId,
                deliveryBids: data.deliveryBids || [],
                deliveryInfo: data.deliveryInfo,
                tipAmount: data.tipAmount,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : (data.deliveredAt ? new Date(data.deliveredAt) : undefined)
            } as Order;
        });
        // Sort by creation date (oldest first - first come first served)
        orders.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateA.getTime() - dateB.getTime();
        });
        return orders;
    } catch (error: any) {
        console.error("Error getting pending orders:", error.message);
        throw new Error(error.message);
    }
}

// Get orders being prepared by a chef
export async function getChefPreparingOrders(chefId: string): Promise<Order[]> {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('chefId', '==', chefId), where('status', '==', 'preparing'));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                customerId: data.customerId || '',
                items: data.items || [],
                totalPrice: data.totalPrice || 0,
                deliveryFee: data.deliveryFee || 0,
                discount: data.discount || 0,
                finalPrice: data.finalPrice || 0,
                status: data.status || 'preparing',
                chefId: data.chefId,
                deliveryPersonId: data.deliveryPersonId,
                deliveryBids: data.deliveryBids || [],
                deliveryInfo: data.deliveryInfo,
                tipAmount: data.tipAmount,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : (data.deliveredAt ? new Date(data.deliveredAt) : undefined)
            } as Order;
        });
        return orders;
    } catch (error: any) {
        console.error("Error getting chef preparing orders:", error.message);
        throw new Error(error.message);
    }
}

// Accept an order (chef accepts to prepare it)
export async function acceptOrder(orderId: string, chefId: string) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: 'preparing',
            chefId: chefId
        });
        console.log(`Order ${orderId} accepted by chef ${chefId}`);
    } catch (error: any) {
        console.error("Error accepting order:", error.message);
        throw new Error(error.message);
    }
}

// Mark order as ready
export async function markOrderReady(orderId: string) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: 'ready'
        });
        console.log(`Order ${orderId} marked as ready`);
    } catch (error: any) {
        console.error("Error marking order as ready:", error.message);
        throw new Error(error.message);
    }
}

// Create a new dish
export async function createDish(
    chefId: string,
    name: string,
    description: string,
    price: number,
    imageUrl: string,
    category: string,
    isVIPOnly: boolean
) {
    try {
        const dishesRef = collection(db, 'dishes');
        const dishData = {
            name,
            description,
            price,
            imageUrl,
            chefId,
            category,
            isVIPOnly,
            isAvailable: true,
            ratings: [],
            averageRating: 0,
            orderCount: 0,
            createdAt: new Date()
        };
        const docRef = await addDoc(dishesRef, dishData);
        console.log('Dish created successfully:', docRef.id);
        return docRef.id;
    } catch (error: any) {
        console.error("Error creating dish:", error.message);
        throw new Error(error.message);
    }
}

// =========================
// Delivery Bids / Delivery
// =========================

// Get orders that are available for delivery (status: preparing or ready)
export async function getAvailableDeliveryOrders() {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('status', 'in', ['preparing', 'ready']));
        const querySnapshot = await getDocs(q);

        const orders = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : (data.deliveredAt ? new Date(data.deliveredAt) : undefined)
            };
        });

        // Optionally filter out orders that already have a deliveryPersonId assigned
        return orders.filter((order: any) => !order.deliveryPersonId);
    } catch (error: any) {
        console.error("Error getting available delivery orders:", error.message);
        throw new Error(error.message);
    }
}

// Type for a single bid entry
interface DeliveryBidEntry {
    deliveryPersonId: string;
    deliveryPersonName: string;
    bidAmount: number;
    createdAt: Date;
}

// Get delivery bids info for multiple orders
export async function getDeliveryBidsForOrders(orderIds: string[]) {
    try {
        if (!orderIds || orderIds.length === 0) {
            return {};
        }

        const bidsCollection = collection(db, 'deliveryBids');
        const result: Record<string, { bids: DeliveryBidEntry[]; lowestBidAmount: number | null; lowestBidderId: string | null }> = {};

        await Promise.all(
            orderIds.map(async (orderId) => {
                const bidDocRef = doc(bidsCollection, orderId);
                const bidSnap = await getDoc(bidDocRef);
                if (bidSnap.exists()) {
                    const data = bidSnap.data() as any;
                    const bids: DeliveryBidEntry[] = (data.bids || []).map((b: any) => ({
                        deliveryPersonId: b.deliveryPersonId,
                        deliveryPersonName: b.deliveryPersonName,
                        bidAmount: b.bidAmount,
                        createdAt: b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
                    }));

                    result[orderId] = {
                        bids,
                        lowestBidAmount: data.lowestBidAmount ?? null,
                        lowestBidderId: data.lowestBidderId ?? null
                    };
                } else {
                    result[orderId] = {
                        bids: [],
                        lowestBidAmount: null,
                        lowestBidderId: null
                    };
                }
            })
        );

        return result;
    } catch (error: any) {
        console.error("Error getting delivery bids:", error.message);
        throw new Error(error.message);
    }
}

// Submit a delivery bid for an order
export async function submitDeliveryBid(
    orderId: string,
    deliveryPersonId: string,
    deliveryPersonName: string,
    bidAmount: number
) {
    try {
        const bidsCollection = collection(db, 'deliveryBids');
        const bidDocRef = doc(bidsCollection, orderId);
        const bidSnap = await getDoc(bidDocRef);

        const newBid: DeliveryBidEntry = {
            deliveryPersonId,
            deliveryPersonName,
            bidAmount,
            createdAt: new Date()
        };

        if (bidSnap.exists()) {
            const data = bidSnap.data() as any;
            const existingBids: DeliveryBidEntry[] = (data.bids || []).map((b: any) => ({
                deliveryPersonId: b.deliveryPersonId,
                deliveryPersonName: b.deliveryPersonName,
                bidAmount: b.bidAmount,
                createdAt: b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
            }));

            const updatedBids = [...existingBids, newBid];

            // Recalculate lowest bid
            let lowestBidAmount: number | null = null;
            let lowestBidderId: string | null = null;
            updatedBids.forEach(bid => {
                if (lowestBidAmount === null || bid.bidAmount < lowestBidAmount) {
                    lowestBidAmount = bid.bidAmount;
                    lowestBidderId = bid.deliveryPersonId;
                }
            });

            await updateDoc(bidDocRef, {
                orderId,
                bids: updatedBids,
                lowestBidAmount,
                lowestBidderId,
                updatedAt: new Date()
            });
        } else {
            // First bid for this order
            await setDoc(bidDocRef, {
                orderId,
                bids: [newBid],
                lowestBidAmount: newBid.bidAmount,
                lowestBidderId: newBid.deliveryPersonId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        console.log(`Bid submitted for order ${orderId} by delivery person ${deliveryPersonId}`);
    } catch (error: any) {
        console.error("Error submitting delivery bid:", error.message);
        throw new Error(error.message);
    }
}

// Get active deliveries for a delivery person (bids that have been accepted)
export async function getActiveDeliveriesForDriver(deliveryPersonId: string): Promise<Order[]> {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('deliveryPersonId', '==', deliveryPersonId),
            where('status', 'in', ['delivering', 'ready'])
        );
        const querySnapshot = await getDocs(q);

        const orders: Order[] = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                customerId: data.customerId || '',
                items: data.items || [],
                totalPrice: data.totalPrice || 0,
                deliveryFee: data.deliveryFee || 0,
                discount: data.discount || 0,
                finalPrice: data.finalPrice || 0,
                status: data.status || 'pending',
                chefId: data.chefId,
                deliveryPersonId: data.deliveryPersonId,
                deliveryBids: data.deliveryBids || [],
                deliveryInfo: data.deliveryInfo,
                tipAmount: data.tipAmount,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : (data.deliveredAt ? new Date(data.deliveredAt) : undefined)
            } as Order;
        });

        return orders;
    } catch (error: any) {
        console.error("Error getting active deliveries for driver:", error.message);
        throw new Error(error.message);
    }
}

// Mark a delivery as finished (delivered)
export async function markDeliveryFinished(orderId: string) {
    try {
        // Get the order to find the delivery person ID
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) {
            throw new Error('Order not found');
        }
        
        const orderData = orderSnap.data();
        const deliveryPersonId = orderData.deliveryPersonId;
        
        if (!deliveryPersonId) {
            throw new Error('No delivery person assigned to this order');
        }
        
        // Update the order status
        await updateDoc(orderRef, {
            status: 'delivered',
            deliveredAt: new Date()
        });
        
        // Update the delivery person's delivery count
        const deliveryPersonRef = doc(db, 'employees', deliveryPersonId);
        const deliveryPersonSnap = await getDoc(deliveryPersonRef);
        
        if (deliveryPersonSnap.exists()) {
            const currentCount = deliveryPersonSnap.data().deliveryCount || 0;
            await updateDoc(deliveryPersonRef, {
                deliveryCount: currentCount + 1
            });
            console.log(`Delivery person ${deliveryPersonId} delivery count updated to ${currentCount + 1}`);
        } else {
            console.warn(`Delivery person ${deliveryPersonId} not found in employees collection`);
        }
        
        console.log(`Order ${orderId} marked as delivered`);
    } catch (error: any) {
        console.error("Error marking delivery as finished:", error.message);
        throw new Error(error.message);
    }
}

// Get delivery history for a delivery person (completed deliveries)
export async function getDeliveryHistoryForDriver(deliveryPersonId: string): Promise<Order[]> {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('deliveryPersonId', '==', deliveryPersonId),
            where('status', '==', 'delivered')
        );
        const querySnapshot = await getDocs(q);

        const orders: Order[] = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                customerId: data.customerId || '',
                items: data.items || [],
                totalPrice: data.totalPrice || 0,
                deliveryFee: data.deliveryFee || 0,
                discount: data.discount || 0,
                finalPrice: data.finalPrice || 0,
                status: data.status || 'delivered',
                chefId: data.chefId,
                deliveryPersonId: data.deliveryPersonId,
                deliveryBids: data.deliveryBids || [],
                deliveryInfo: data.deliveryInfo,
                tipAmount: data.tipAmount,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : (data.deliveredAt ? new Date(data.deliveredAt) : undefined)
            } as Order;
        });

        // Sort by deliveredAt desc, fallback to createdAt
        orders.sort((a, b) => {
            const dateA = (a.deliveredAt || a.createdAt) as Date;
            const dateB = (b.deliveredAt || b.createdAt) as Date;
            return dateB.getTime() - dateA.getTime();
        });

        return orders;
    } catch (error: any) {
        console.error("Error getting delivery history for driver:", error.message);
        throw new Error(error.message);
    }
}

// Get all orders that currently have delivery bids
export async function getOrdersWithBids() {
    try {
        const bidsCollectionRef = collection(db, 'deliveryBids');
        const bidsSnapshot = await getDocs(bidsCollectionRef);

        const results: any[] = [];

        await Promise.all(
            bidsSnapshot.docs.map(async (bidDoc) => {
                const orderId = bidDoc.id;
                const bidData = bidDoc.data() as any;

                // Fetch the corresponding order
                const orderRef = doc(db, 'orders', orderId);
                const orderSnap = await getDoc(orderRef);
                if (!orderSnap.exists()) return;

                const data = orderSnap.data() as any;

                // If the order is already delivering (or delivered), skip it from current bids
                if (data.status === 'delivering' || data.status === 'delivered') {
                    return;
                }

                const order = {
                    id: orderSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                    deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : (data.deliveredAt ? new Date(data.deliveredAt) : undefined)
                };

                const bids: DeliveryBidEntry[] = (bidData.bids || []).map((b: any) => ({
                    deliveryPersonId: b.deliveryPersonId,
                    deliveryPersonName: b.deliveryPersonName,
                    bidAmount: b.bidAmount,
                    createdAt: b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
                }));

                results.push({
                    order,
                    bids,
                    lowestBidAmount: bidData.lowestBidAmount ?? null,
                    lowestBidderId: bidData.lowestBidderId ?? null
                });
            })
        );

        // Sort by order creation date (newest first)
        results.sort((a, b) => {
            const dateA = a.order.createdAt instanceof Date ? a.order.createdAt : new Date(a.order.createdAt);
            const dateB = b.order.createdAt instanceof Date ? b.order.createdAt : new Date(b.order.createdAt);
            return dateB.getTime() - dateA.getTime();
        });

        return results;
    } catch (error: any) {
        console.error("Error getting orders with bids:", error.message);
        throw new Error(error.message);
    }
}

// Accept a specific delivery bid for an order
export async function acceptDeliveryBid(
    orderId: string,
    deliveryPersonId: string,
    chosenBidAmount: number,
    managerId: string,
    overrideReason?: string
) {
    try {
        const bidsCollectionRef = collection(db, 'deliveryBids');
        const bidDocRef = doc(bidsCollectionRef, orderId);
        const bidSnap = await getDoc(bidDocRef);

        if (!bidSnap.exists()) {
            throw new Error('No bids found for this order.');
        }

        const bidData = bidSnap.data() as any;
        const lowestBidAmount: number | null = bidData.lowestBidAmount ?? null;
        const lowestBidderId: string | null = bidData.lowestBidderId ?? null;

        const isChosenLowest = lowestBidAmount !== null &&
            Math.abs(chosenBidAmount - lowestBidAmount) < 0.0001 &&
            deliveryPersonId === lowestBidderId;

        // If manager is not choosing the lowest bid, log an HR action with reason
        if (!isChosenLowest) {
            if (!overrideReason || !overrideReason.trim()) {
                throw new Error('Override reason is required when not choosing the lowest bid.');
            }

            const hrActionsRef = collection(db, 'hrActions');
            await addDoc(hrActionsRef, {
                managerId,
                targetId: deliveryPersonId,
                actionType: 'delivery_bid_override',
                orderId,
                lowestBidAmount,
                chosenBidAmount,
                reason: overrideReason,
                timestamp: new Date()
            });
        }

        // Assign the order to the chosen delivery person and mark as delivering
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            deliveryPersonId,
            status: 'delivering'
        });

        console.log(`Order ${orderId} assigned to delivery person ${deliveryPersonId} with status 'delivering'`);
    } catch (error: any) {
        console.error("Error accepting delivery bid:", error.message);
        throw new Error(error.message);
    }
}

// Get all discussions
export async function getAllDiscussions() {
    try {
        const discussionsRef = collection(db, 'discussions');
        const querySnapshot = await getDocs(discussionsRef);
        
        const discussions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
                lastReplyAt: data.lastReplyAt?.toDate ? data.lastReplyAt.toDate() : (data.lastReplyAt ? new Date(data.lastReplyAt) : undefined)
            };
        });
        
        // Sort by pinned first, then by lastReplyAt or createdAt
        discussions.sort((a: any, b: any) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const dateA = a.lastReplyAt || a.updatedAt || a.createdAt;
            const dateB = b.lastReplyAt || b.updatedAt || b.createdAt;
            return dateB.getTime() - dateA.getTime();
        });
        
        return discussions;
    } catch (error: any) {
        console.log("Error getting discussions:", error.message);
        throw new Error(error.message);
    }
}

// Get replies for a discussion
export async function getDiscussionReplies(discussionId: string) {
    try {
        const discussionRef = doc(db, 'discussions', discussionId);
        const repliesRef = collection(discussionRef, 'replies');
        const querySnapshot = await getDocs(repliesRef);
        
        const replies = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            };
        });
        
        // Sort by creation date (oldest first)
        replies.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateA.getTime() - dateB.getTime();
        });
        
        return replies;
    } catch (error: any) {
        console.log("Error getting replies:", error.message);
        throw new Error(error.message);
    }
}

// Create a new discussion
export async function createDiscussion(
    authorId: string,
    authorName: string,
    authorRole: string,
    title: string,
    content: string,
    category: string,
    tags: string[] = []
) {
    try {
        const discussionsRef = collection(db, 'discussions');
        const discussionId = `discussion_${Date.now()}`;
        
        const discussionData = {
            discussionId,
            title,
            content,
            category,
            tags,
            authorId,
            authorName,
            authorRole,
            viewCount: 0,
            replyCount: 0,
            likeCount: 0,
            likedBy: [],
            status: 'active',
            isPinned: false,
            isResolved: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastReplyAt: null,
            lastReplyBy: null
        };
        
        await setDoc(doc(discussionsRef, discussionId), discussionData);
        console.log('Discussion created successfully:', discussionId);
        return discussionId;
    } catch (error: any) {
        console.log("Error creating discussion:", error.message);
        throw new Error(error.message);
    }
}

// Add a reply to a discussion
export async function addReplyToDiscussion(
    discussionId: string,
    authorId: string,
    authorName: string,
    authorRole: string,
    content: string
) {
    try {
        const discussionRef = doc(db, 'discussions', discussionId);
        const repliesRef = collection(discussionRef, 'replies');
        const replyId = `reply_${Date.now()}`;
        
        const replyData = {
            replyId,
            content,
            authorId,
            authorName,
            authorRole,
            likeCount: 0,
            isAcceptedAnswer: false,
            createdAt: new Date()
        };
        
        await addDoc(repliesRef, replyData);
        
        // Update discussion reply count and last reply info
        const discussionDoc = await getDoc(discussionRef);
        if (discussionDoc.exists()) {
            const currentData = discussionDoc.data();
            await updateDoc(discussionRef, {
                replyCount: (currentData.replyCount || 0) + 1,
                lastReplyAt: new Date(),
                lastReplyBy: authorId,
                updatedAt: new Date()
            });
        }
        
        console.log('Reply added successfully:', replyId);
        return replyId;
    } catch (error: any) {
        console.log("Error adding reply:", error.message);
        throw new Error(error.message);
    }
}

// Like/unlike a discussion
export async function toggleDiscussionLike(discussionId: string, userId: string) {
    try {
        const discussionRef = doc(db, 'discussions', discussionId);
        const discussionDoc = await getDoc(discussionRef);
        
        if (!discussionDoc.exists()) {
            throw new Error('Discussion not found');
        }
        
        const data = discussionDoc.data();
        const likedBy = data.likedBy || [];
        const isLiked = likedBy.includes(userId);
        
        if (isLiked) {
            // Unlike
            await updateDoc(discussionRef, {
                likedBy: likedBy.filter((id: string) => id !== userId),
                likeCount: Math.max(0, (data.likeCount || 0) - 1)
            });
        } else {
            // Like
            await updateDoc(discussionRef, {
                likedBy: [...likedBy, userId],
                likeCount: (data.likeCount || 0) + 1
            });
        }
        
        return !isLiked;
    } catch (error: any) {
        console.log("Error toggling like:", error.message);
        throw new Error(error.message);
    }
}

// Submit feedback for a chef or delivery person
export async function submitFeedback(
    orderId: string,
    customerId: string,
    customerName: string,
    targetType: 'chef' | 'delivery',
    targetId: string,
    targetName: string,
    rating: number,
    sentiment: 'compliment' | 'complaint',
    comment: string,
    dishIds?: string[]
) {
    try {
        // Create feedback document
        const feedbackRef = collection(db, 'feedback');
        const feedbackData = {
            orderId,
            customerId,
            customerName,
            targetType,
            targetId,
            targetName,
            rating,
            sentiment,
            comment,
            dishIds: dishIds || [],
            createdAt: new Date()
        };
        
        const feedbackDocRef = await addDoc(feedbackRef, feedbackData);
        
        // Update employee's average rating
        const employeeRef = doc(db, 'employees', targetId);
        const employeeSnap = await getDoc(employeeRef);
        
        if (employeeSnap.exists()) {
            const employeeData = employeeSnap.data();
            const currentRatings = employeeData.ratings || [];
            const newRatings = [...currentRatings, rating];
            const averageRating = newRatings.reduce((sum, r) => sum + r, 0) / newRatings.length;
            
            await updateDoc(employeeRef, {
                ratings: newRatings,
                averageRating: averageRating
            });
            
            // Automatically check for demotion/promotion after feedback submission (only for employees)
            if (targetType === 'chef' || targetType === 'delivery') {
                try {
                    await checkAndApplyEmployeeActions(targetId);
                } catch (err) {
                    // If auto-check fails, don't block feedback submission
                    console.error('Error checking employee actions after feedback:', err);
                }
            }
        }
        
        console.log('Feedback submitted:', feedbackDocRef.id);
        return feedbackDocRef.id;
    } catch (error: any) {
        console.error("Error submitting feedback:", error.message);
        throw new Error(error.message);
    }
}

// Get all feedback for a specific employee (chef or delivery) or customer
export async function getFeedbackForEmployee(targetType: 'chef' | 'delivery' | 'customer', targetId: string) {
    try {
        const feedbackRef = collection(db, 'feedback');
        const q = query(
            feedbackRef,
            where('targetType', '==', targetType),
            where('targetId', '==', targetId)
        );
        const querySnapshot = await getDocs(q);
        
        const feedbacks = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                disputeCreatedAt: data.disputeCreatedAt?.toDate ? data.disputeCreatedAt.toDate() : (data.disputeCreatedAt ? new Date(data.disputeCreatedAt) : undefined),
                managerDecisionAt: data.managerDecisionAt?.toDate ? data.managerDecisionAt.toDate() : (data.managerDecisionAt ? new Date(data.managerDecisionAt) : undefined)
            };
        });
        
        // Sort by creation date (newest first)
        feedbacks.sort((a: any, b: any) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        
        return feedbacks;
    } catch (error: any) {
        console.error("Error getting feedback for employee:", error.message);
        throw new Error(error.message);
    }
}

// Check if customer has already left feedback for an order
export async function hasFeedbackForOrder(orderId: string, customerId: string, targetType: 'chef' | 'delivery' | 'customer') {
    try {
        const feedbackRef = collection(db, 'feedback');
        const q = query(
            feedbackRef,
            where('orderId', '==', orderId),
            where('customerId', '==', customerId),
            where('targetType', '==', targetType)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error: any) {
        console.error("Error checking feedback:", error.message);
        return false;
    }
}

// Get all complaints (for manager dashboard)
export async function getAllComplaints() {
    try {
        const feedbackRef = collection(db, 'feedback');
        const q = query(
            feedbackRef,
            where('sentiment', '==', 'complaint')
        );
        const querySnapshot = await getDocs(q);
        
        const complaints = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                disputeCreatedAt: data.disputeCreatedAt?.toDate ? data.disputeCreatedAt.toDate() : (data.disputeCreatedAt ? new Date(data.disputeCreatedAt) : undefined),
                managerDecisionAt: data.managerDecisionAt?.toDate ? data.managerDecisionAt.toDate() : (data.managerDecisionAt ? new Date(data.managerDecisionAt) : undefined)
            };
        });
        
        // Sort by creation date (newest first)
        complaints.sort((a: any, b: any) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        
        return complaints;
    } catch (error: any) {
        console.error("Error getting all complaints:", error.message);
        throw new Error(error.message);
    }
}

// Check and apply demotion/promotion logic for an employee
export async function checkAndApplyEmployeeActions(employeeId: string) {
    try {
        const employeeRef = doc(db, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        
        if (!employeeSnap.exists()) {
            throw new Error('Employee not found');
        }
        
        const employeeData = employeeSnap.data();
        const currentStatus = employeeData.status || 'active';
        const currentSalary = employeeData.salary || 0;
        const demotionCount = employeeData.demotionCount || 0;
        
        // Get all feedback for this employee (only non-disputed complaints count)
        const feedbacks = await getFeedbackForEmployee(employeeData.role, employeeId);
        
        // Filter out dismissed complaints
        const validFeedbacks = feedbacks.filter((fb: any) => 
            fb.managerDecision !== 'dismissed' || !fb.managerDecision
        );
        
        // Separate complaints and compliments
        const complaints = validFeedbacks.filter((fb: any) => fb.sentiment === 'complaint');
        const compliments = validFeedbacks.filter((fb: any) => fb.sentiment === 'compliment');
        
        // Calculate net complaints (complaints - compliments, minimum 0)
        const netComplaints = Math.max(0, complaints.length - compliments.length);
        
        // Get recent ratings (last 10 ratings)
        const recentRatings = validFeedbacks
            .slice(0, 10)
            .map((fb: any) => fb.rating)
            .filter((r: any) => r !== undefined);
        
        const averageRecentRating = recentRatings.length > 0
            ? recentRatings.reduce((sum: number, r: number) => sum + r, 0) / recentRatings.length
            : employeeData.averageRating || 0;
        
        // Check for demotion conditions
        const shouldDemote = 
            (averageRecentRating < 2 && recentRatings.length >= 3) || // Consistently low ratings
            netComplaints >= 3; // 3 or more net complaints
        
        // Check for promotion conditions
        const shouldPromote = 
            (averageRecentRating > 4 && recentRatings.length >= 3) || // Consistently high ratings
            compliments.length >= 3; // 3 or more compliments
        
        // Only apply actions if employee is currently active
        if (currentStatus === 'active') {
            if (shouldDemote) {
                // Demote employee
                const newDemotionCount = demotionCount + 1;
                const newSalary = Math.max(currentSalary * 0.9, currentSalary - 5000); // Reduce by 10% or $5000, whichever is less
                const newStatus = newDemotionCount >= 2 ? 'fired' : 'demoted';
                
                await updateDoc(employeeRef, {
                    status: newStatus,
                    salary: newSalary,
                    demotionCount: newDemotionCount
                });
                
                // If fired, delete all dishes for chefs
                if (newStatus === 'fired' && employeeData.role === 'chef') {
                    const dishesRef = collection(db, 'dishes');
                    const q = query(dishesRef, where('chefId', '==', employeeId));
                    const querySnapshot = await getDocs(q);
                    const deletePromises = querySnapshot.docs.map(dishDoc => deleteDoc(doc(db, 'dishes', dishDoc.id)));
                    await Promise.all(deletePromises);
                    console.log(`Deleted ${querySnapshot.docs.length} dishes for fired chef ${employeeId}`);
                }
                
                console.log(`Employee ${employeeId} ${newStatus === 'fired' ? 'fired' : 'demoted'}`);
            } else if (shouldPromote) {
                // Give bonus (increase salary)
                const bonusAmount = currentSalary * 0.1; // 10% bonus
                const newSalary = currentSalary + bonusAmount;
                
                await updateDoc(employeeRef, {
                    salary: newSalary
                });
                
                console.log(`Employee ${employeeId} received bonus`);
            }
        }
        
        return { shouldDemote, shouldPromote, netComplaints, averageRecentRating };
    } catch (error: any) {
        console.error("Error checking employee actions:", error.message);
        throw new Error(error.message);
    }
}

// Submit feedback for a customer (by delivery person)
export async function submitCustomerFeedback(
    orderId: string,
    deliveryPersonId: string,
    deliveryPersonName: string,
    customerId: string,
    customerName: string,
    rating: number,
    sentiment: 'compliment' | 'complaint',
    comment: string
) {
    try {
        const feedbackRef = collection(db, 'feedback');
        const feedbackData = {
            orderId,
            customerId: deliveryPersonId, // The person submitting the feedback
            customerName: deliveryPersonName,
            targetType: 'customer',
            targetId: customerId,
            targetName: customerName,
            rating,
            sentiment,
            comment,
            createdAt: new Date()
        };
        
        const feedbackDocRef = await addDoc(feedbackRef, feedbackData);
        console.log('Customer feedback submitted:', feedbackDocRef.id);
        return feedbackDocRef.id;
    } catch (error: any) {
        console.error("Error submitting customer feedback:", error.message);
        throw new Error(error.message);
    }
}

// Submit a complaint about a discussion comment
export async function submitCommentComplaint(
    discussionId: string,
    discussionTitle: string,
    replyId: string,
    replyContent: string,
    commenterId: string,
    commenterName: string,
    commenterRole: string,
    reporterId: string,
    reporterName: string,
    reason: string
) {
    try {
        // Get reporter's info to determine if they're VIP (for complaint weight)
        const reporterRef = doc(db, 'users', reporterId);
        const reporterSnap = await getDoc(reporterRef);
        const isReporterVIP = reporterSnap.exists() ? (reporterSnap.data().isVIP || false) : false;
        const complaintWeight = isReporterVIP ? 2 : 1;

        const feedbackRef = collection(db, 'feedback');
        const feedbackData = {
            // Discussion/comment context
            discussionId,
            discussionTitle,
            replyId,
            replyContent,
            
            // Reporter info (person filing complaint)
            customerId: reporterId,
            customerName: reporterName,
            
            // Target info (person being complained about)
            targetType: 'customer',
            targetId: commenterId,
            targetName: commenterName,
            targetRole: commenterRole,
            
            // Complaint details
            sentiment: 'complaint',
            comment: reason,
            rating: 0, // Not applicable for comment complaints
            weight: complaintWeight,
            
            // Status
            isDisputed: false,
            managerDecision: null,
            
            createdAt: new Date()
        };
        
        const feedbackDocRef = await addDoc(feedbackRef, feedbackData);
        console.log('Comment complaint submitted:', feedbackDocRef.id);
        return feedbackDocRef.id;
    } catch (error: any) {
        console.error("Error submitting comment complaint:", error.message);
        throw new Error(error.message);
    }
}

// Submit a complaint about a discussion post
export async function submitDiscussionComplaint(
    discussionId: string,
    discussionTitle: string,
    discussionContent: string,
    authorId: string,
    authorName: string,
    authorRole: string,
    reporterId: string,
    reporterName: string,
    reason: string
) {
    try {
        // Get reporter's info to determine if they're VIP (for complaint weight)
        const reporterRef = doc(db, 'users', reporterId);
        const reporterSnap = await getDoc(reporterRef);
        const isReporterVIP = reporterSnap.exists() ? (reporterSnap.data().isVIP || false) : false;
        const complaintWeight = isReporterVIP ? 2 : 1;

        const feedbackRef = collection(db, 'feedback');
        const feedbackData = {
            // Discussion context
            discussionId,
            discussionTitle,
            discussionContent,
            
            // Reporter info (person filing complaint)
            customerId: reporterId,
            customerName: reporterName,
            
            // Target info (person being complained about)
            targetType: 'customer',
            targetId: authorId,
            targetName: authorName,
            targetRole: authorRole,
            
            // Complaint details
            sentiment: 'complaint',
            comment: reason,
            rating: 0, // Not applicable for discussion complaints
            weight: complaintWeight,
            
            // Status
            isDisputed: false,
            managerDecision: null,
            
            createdAt: new Date()
        };
        
        const feedbackDocRef = await addDoc(feedbackRef, feedbackData);
        console.log('Discussion complaint submitted:', feedbackDocRef.id);
        return feedbackDocRef.id;
    } catch (error: any) {
        console.error("Error submitting discussion complaint:", error.message);
        throw new Error(error.message);
    }
}

// Dispute a complaint
export async function disputeComplaint(feedbackId: string, disputerId: string, disputeReason: string) {
    try {
        const feedbackRef = doc(db, 'feedback', feedbackId);
        const feedbackSnap = await getDoc(feedbackRef);
        
        if (!feedbackSnap.exists()) {
            throw new Error('Feedback not found');
        }
        
        await updateDoc(feedbackRef, {
            isDisputed: true,
            disputeReason,
            disputedBy: disputerId,
            disputeCreatedAt: new Date()
        });
        
        console.log(`Complaint ${feedbackId} disputed by ${disputerId}`);
    } catch (error: any) {
        console.error("Error disputing complaint:", error.message);
        throw new Error(error.message);
    }
}

// Get all disputes (for manager)
export async function getAllDisputes() {
    try {
        const feedbackRef = collection(db, 'feedback');
        const q = query(
            feedbackRef,
            where('isDisputed', '==', true)
        );
        const querySnapshot = await getDocs(q);
        
        const disputes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                disputeCreatedAt: data.disputeCreatedAt?.toDate ? data.disputeCreatedAt.toDate() : (data.disputeCreatedAt ? new Date(data.disputeCreatedAt) : undefined)
            };
        });
        
        // Filter out already resolved disputes
        const pendingDisputes = disputes.filter((d: any) => !d.managerDecision);
        
        // Sort by dispute date (newest first)
        pendingDisputes.sort((a: any, b: any) => {
            const dateA = a.disputeCreatedAt instanceof Date ? a.disputeCreatedAt : new Date(a.disputeCreatedAt);
            const dateB = b.disputeCreatedAt instanceof Date ? b.disputeCreatedAt : new Date(b.disputeCreatedAt);
            return dateB.getTime() - dateA.getTime();
        });
        
        return pendingDisputes;
    } catch (error: any) {
        console.error("Error getting disputes:", error.message);
        throw new Error(error.message);
    }
}

// Get disputes for a specific user (employee or customer)
export async function getDisputesForUser(userId: string) {
    try {
        const feedbackRef = collection(db, 'feedback');
        const q = query(
            feedbackRef,
            where('disputedBy', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        
        const disputes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                disputeCreatedAt: data.disputeCreatedAt?.toDate ? data.disputeCreatedAt.toDate() : (data.disputeCreatedAt ? new Date(data.disputeCreatedAt) : undefined),
                managerDecisionAt: data.managerDecisionAt?.toDate ? data.managerDecisionAt.toDate() : (data.managerDecisionAt ? new Date(data.managerDecisionAt) : undefined)
            };
        });
        
        // Sort by dispute date (newest first)
        disputes.sort((a: any, b: any) => {
            const dateA = a.disputeCreatedAt instanceof Date ? a.disputeCreatedAt : new Date(a.disputeCreatedAt);
            const dateB = b.disputeCreatedAt instanceof Date ? b.disputeCreatedAt : new Date(b.disputeCreatedAt);
            return dateB.getTime() - dateA.getTime();
        });
        
        return disputes;
    } catch (error: any) {
        console.error("Error getting disputes for user:", error.message);
        throw new Error(error.message);
    }
}

// Manager resolves a dispute
export async function resolveDispute(
    feedbackId: string,
    managerId: string,
    decision: 'dismissed' | 'upheld',
    reason: string
) {
    try {
        const feedbackRef = doc(db, 'feedback', feedbackId);
        const feedbackSnap = await getDoc(feedbackRef);
        
        if (!feedbackSnap.exists()) {
            throw new Error('Feedback not found');
        }
        
        const feedbackData = feedbackSnap.data();
        
        await updateDoc(feedbackRef, {
            managerDecision: decision,
            managerDecisionReason: reason,
            managerDecisionAt: new Date(),
            managerId
        });
        
        // If complaint is dismissed, add warning to the person who filed it
        if (decision === 'dismissed') {
            const complainantId = feedbackData.customerId; // The person who filed the complaint
            
            // Check if complainant is a customer or employee
            const customerRef = doc(db, 'users', complainantId);
            const customerSnap = await getDoc(customerRef);
            
            if (customerSnap.exists()) {
                // It's a customer
                const customerData = customerSnap.data();
                const currentWarnings = customerData.warnings || [];
                const isVIP = customerData.isVIP || false;
                
                // Add warning
                const newWarning = {
                    id: `warning_${Date.now()}`,
                    userId: complainantId,
                    reason: `False complaint against ${feedbackData.targetName}`,
                    issuedAt: new Date(),
                    relatedComplaintId: feedbackId
                };
                
                const updatedWarnings = [...currentWarnings, newWarning];
                
                // Check consequences
                if (isVIP && updatedWarnings.length >= 2) {
                    // Downgrade VIP to regular customer and clear warnings
                    await updateDoc(customerRef, {
                        isVIP: false,
                        warnings: []
                    });
                    console.log(`VIP ${complainantId} downgraded to regular customer due to 2 warnings`);
                } else if (!isVIP && updatedWarnings.length >= 3) {
                    // Deregister customer
                    await updateDoc(customerRef, {
                        isBlacklisted: true,
                        warnings: updatedWarnings
                    });
                    console.log(`Customer ${complainantId} deregistered due to 3 warnings`);
                } else {
                    // Just add warning
                    await updateDoc(customerRef, {
                        warnings: updatedWarnings
                    });
                }
            } else {
                // Check if it's an employee
                const employeeRef = doc(db, 'employees', complainantId);
                const employeeSnap = await getDoc(employeeRef);
                
                if (employeeSnap.exists()) {
                    const employeeData = employeeSnap.data();
                    const currentWarnings = employeeData.warnings || [];
                    
                    const newWarning = {
                        id: `warning_${Date.now()}`,
                        userId: complainantId,
                        reason: `False complaint against ${feedbackData.targetName}`,
                        issuedAt: new Date(),
                        relatedComplaintId: feedbackId
                    };
                    
                    await updateDoc(employeeRef, {
                        warnings: [...currentWarnings, newWarning]
                    });
                }
            }
        }
        
        // If complaint is upheld, delete the discussion or comment
        if (decision === 'upheld') {
            // Check if this is a complaint about a discussion comment/reply
            if (feedbackData.replyId && feedbackData.discussionId) {
                // Delete the reply/comment
                try {
                    const discussionRef = doc(db, 'discussions', feedbackData.discussionId);
                    const replyRef = doc(discussionRef, 'replies', feedbackData.replyId);
                    await deleteDoc(replyRef);
                    
                    // Update discussion reply count
                    const discussionSnap = await getDoc(discussionRef);
                    if (discussionSnap.exists()) {
                        const discussionData = discussionSnap.data();
                        const currentReplyCount = discussionData.replyCount || 0;
                        await updateDoc(discussionRef, {
                            replyCount: Math.max(0, currentReplyCount - 1)
                        });
                    }
                    
                    console.log(`Reply ${feedbackData.replyId} deleted from discussion ${feedbackData.discussionId}`);
                } catch (err) {
                    console.error('Error deleting reply:', err);
                    // Don't throw - the complaint resolution should still succeed
                }
            }
            // Check if this is a complaint about a discussion post
            else if (feedbackData.discussionId && !feedbackData.replyId) {
                // Delete the entire discussion
                try {
                    const discussionRef = doc(db, 'discussions', feedbackData.discussionId);
                    await deleteDoc(discussionRef);
                    console.log(`Discussion ${feedbackData.discussionId} deleted`);
                } catch (err) {
                    console.error('Error deleting discussion:', err);
                    // Don't throw - the complaint resolution should still succeed
                }
            }
            
            // Re-check employee actions if complaint was upheld (might trigger demotion)
            if (feedbackData.targetType !== 'customer') {
                try {
                    await checkAndApplyEmployeeActions(feedbackData.targetId);
                } catch (err) {
                    console.error('Error re-checking employee actions:', err);
                }
            }
        }
        
        console.log(`Dispute ${feedbackId} resolved: ${decision}`);
    } catch (error: any) {
        console.error("Error resolving dispute:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Calculate relevance score for a knowledge base entry
 */
function calculateRelevanceScore(query: string, question: string, answer: string): number {
    const lowerQuery = query.toLowerCase().trim();
    const lowerQuestion = question.toLowerCase();
    const lowerAnswer = answer.toLowerCase();
    
    // Split query into keywords (remove common words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'what', 'how', 'when', 'where', 'why'];
    const queryKeywords = lowerQuery.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
    
    let score = 0;
    
    // Exact match in question (highest priority)
    if (lowerQuestion === lowerQuery) {
        score += 100;
    } else if (lowerQuestion.includes(lowerQuery)) {
        score += 50;
    }
    
    // Exact match in answer
    if (lowerAnswer.includes(lowerQuery)) {
        score += 30;
    }
    
    // Keyword matching - check how many keywords appear
    let matchedKeywords = 0;
    for (const keyword of queryKeywords) {
        if (lowerQuestion.includes(keyword)) {
            matchedKeywords++;
            score += 10;
        }
        if (lowerAnswer.includes(keyword)) {
            matchedKeywords++;
            score += 5;
        }
    }
    
    // Bonus for matching all keywords
    if (queryKeywords.length > 0 && matchedKeywords === queryKeywords.length * 2) {
        score += 20;
    }
    
    // Fuzzy matching - check for similar words (simple character similarity)
    const queryWords = lowerQuery.split(/\s+/);
    for (const queryWord of queryWords) {
        if (queryWord.length < 3) continue;
        
        // Check if similar word exists (allowing 1-2 character difference)
        const questionWords = lowerQuestion.split(/\s+/);
        for (const qWord of questionWords) {
            if (qWord.includes(queryWord) || queryWord.includes(qWord)) {
                score += 3;
            } else if (Math.abs(qWord.length - queryWord.length) <= 2) {
                // Simple Levenshtein-like check for similar words
                let differences = 0;
                const minLen = Math.min(qWord.length, queryWord.length);
                for (let i = 0; i < minLen; i++) {
                    if (qWord[i] !== queryWord[i]) differences++;
                }
                if (differences <= 1 && minLen >= 3) {
                    score += 2;
                }
            }
        }
    }
    
    return score;
}

/**
 * Search knowledge base in Firestore with improved matching
 * Returns null if search fails (e.g., insufficient permissions for visitors)
 */
export async function searchKnowledgeBaseInFirestore(queryText: string): Promise<KnowledgeBaseEntry | null> {
    try {
        const knowledgeBaseRef = collection(db, 'knowledgebase');
        const snapshot = await getDocs(knowledgeBaseRef);
        
        const query = queryText.trim();
        if (!query) {
            return null;
        }
        
        const candidates: Array<{ entry: KnowledgeBaseEntry; score: number }> = [];
        
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            
            // Check if entry is flagged
            if (data.isFlagged === true) {
                continue; // Skip flagged entries
            }
            
            // Check if author is banned (handle errors gracefully for visitors)
            try {
                const isBanned = await isAuthorBanned(data.authorId);
                if (isBanned) {
                    continue; // Skip entries from banned authors
                }
            } catch (banCheckError: any) {
                // If we can't check ban status (e.g., insufficient permissions), continue anyway
                // This allows visitors to still see knowledge base entries
                console.log("Could not check author ban status, continuing:", banCheckError.message);
            }
            
            const question = data.question || '';
            const answer = data.answer || '';
            
            // Calculate relevance score
            const score = calculateRelevanceScore(query, question, answer);
            
            // Only consider entries with a minimum score threshold
            if (score > 5) {
                candidates.push({
                    entry: {
                        id: docSnap.id,
                        question: data.question,
                        answer: data.answer,
                        authorId: data.authorId,
                        category: data.category,
                        rating: data.rating || 0,
                        ratingCount: data.ratingCount || 0,
                        isFlagged: data.isFlagged || false,
                        createdAt: data.createdAt?.toDate() || new Date()
                    },
                    score: score
                });
            }
        }
        
        // Sort by score (highest first) and also consider rating
        candidates.sort((a, b) => {
            // Primary sort by relevance score
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // Secondary sort by rating (higher rated entries preferred)
            return (b.entry.rating || 0) - (a.entry.rating || 0);
        });
        
        // Return the best match if score is above threshold
        if (candidates.length > 0 && candidates[0].score >= 10) {
            return candidates[0].entry;
        }
        
        return null;
    } catch (error: any) {
        // Handle permission errors gracefully - visitors may not have access to knowledge base
        // In this case, return null so the system falls back to Gemini
        if (error.message?.includes('permission') || error.message?.includes('Permission') || 
            error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
            console.log("Knowledge base access denied (likely visitor), falling back to Gemini:", error.message);
            return null;
        }
        console.error("Error searching knowledge base:", error.message);
        // For other errors, also return null to allow fallback to Gemini
        return null;
    }
}

/**
 * Build comprehensive context for Gemini about the restaurant and app features
 */
async function buildGeminiContext(): Promise<string> {
    let dishList = 'Menu items are available. Please check the menu section for current dishes and prices.';
    
    try {
        // Fetch available dishes - handle errors gracefully for visitors
        const dishes = await getAllDishes();
        if (dishes && dishes.length > 0) {
            dishList = dishes.map((d: any) => `- ${d.name} (${d.category}) - ${d.description} - $${d.price.toFixed(2)}${d.isVIPOnly ? ' [VIP Only]' : ''}`).join('\n');
        }
    } catch (error: any) {
        // Handle permission errors gracefully - visitors may not have access to dishes collection
        if (error.message?.includes('permission') || error.message?.includes('Permission') || 
            error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
            console.log("Cannot fetch dishes (likely visitor), using fallback context:", error.message);
            // Keep the default dishList message
        } else {
            console.error("Error fetching dishes for context:", error.message);
            // Keep the default dishList message
        }
    }
    
    const context = `You are a helpful AI assistant for "Curry Munchas", a restaurant ordering system. Your role is to help customers and visitors with questions about the restaurant, menu, ordering process, and app features.

RESTAURANT INFORMATION:
- Restaurant Name: Curry Munchas
- Specialization: All types of food, with a focus on curry dishes
- The restaurant operates an online ordering platform where customers can browse menu items, place orders, and have food delivered.

CURRENT MENU ITEMS:
${dishList}

APP FEATURES FOR CUSTOMERS:

1. ACCOUNT & REGISTRATION:
   - Visitors can browse the menu without registering
   - To place orders, users must register as customers
   - Customers have an account balance system - they must deposit funds before ordering
   - Account balance is used to pay for orders (including subtotal, delivery fee, tips)

2. VIP MEMBERSHIP:
   - Customers can become VIP members by meeting ONE of these criteria:
     * Spending $100 or more in total orders, OR
     * Completing 3 or more orders
   - VIP status requires: No warnings on their account
   - VIP Benefits:
     * 5% discount on all orders
     * Access to exclusive VIP-only dishes
     * 1 free delivery for every 3 orders placed
     * VIP complaints/feedback carry double weight in the system
   - VIP status can be lost if a customer receives 2 or more warnings

3. ORDERING PROCESS:
   - Customers browse the menu and add items to their cart
   - At checkout, customers provide:
     * Delivery address (street, city, state, zip code)
     * Phone number
     * Optional delivery instructions
   - Customers can add tips (0%, 5%, 10%, 15%, 20%, or custom amount)
   - VIP customers can use free deliveries if available
   - Orders are paid from account balance (must have sufficient funds)
   - Standard delivery fee: $5.00 (waived for VIP customers using free delivery)

4. ORDER STATUS & TRACKING:
   - Orders go through these statuses: pending → preparing → ready → out for delivery → delivered
   - Customers can view their order history
   - Customers receive notifications about order status updates

5. RATINGS & FEEDBACK:
   - After delivery, customers can rate:
     * The chef who prepared the order
     * The delivery person
   - Ratings help maintain quality and improve service
   - Customers can also leave written feedback/complaints

6. COMPLAINTS & DISPUTES:
   - Customers can file complaints about chefs, delivery persons, or other customers
   - Complaints are reviewed by managers
   - False complaints result in warnings
   - Customers with 3+ warnings may face account restrictions
   - VIP customers' complaints count double in the system

7. DISCUSSION FORUM:
   - Customers can participate in discussion forums
   - Categories include: General, Menu, Service, VIP Member Lounge
   - Users can create topics, reply, and engage with the community

8. ACCOUNT MANAGEMENT:
   - Customers can deposit funds to their account balance
   - View order history and statistics
   - Track progress toward VIP status
   - Manage favorites (saved dishes)

FEATURES FOR VISITORS (Non-Registered Users):
- Browse the full menu
- View dish descriptions, prices, and categories
- See popular and top-rated dishes
- Use the AI chat assistant to ask questions
- Register to become a customer and start ordering

IMPORTANT NOTES:
- All orders require sufficient account balance
- VIP-only dishes are marked clearly and only accessible to VIP members
- The system tracks order count, total spending, and account warnings
- Delivery is available for all orders
- Customers can track their progress toward VIP status on their dashboard

When answering questions:
- Be friendly, helpful, and concise
- Provide accurate information based on the features above
- If asked about specific dishes, refer to the current menu list
- If asked about VIP status, explain the requirements clearly
- Guide users on how to use features (ordering, deposits, etc.)
- For questions about specific account details, suggest they check their dashboard

Now, answer this user question:`;

    return context;
}

/**
 * Call Gemini API for LLM response
 */
export async function getGeminiResponse(question: string): Promise<string> {
    try {
        // @ts-ignore - VITE_GEMINI_API_KEY is defined in .env
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('VITE_GEMINI_API_KEY not found in environment variables');
        }

        // Build comprehensive context
        const context = await buildGeminiContext();
        const fullPrompt = `${context}\n\n${question}`;

        // Use v1 API instead of v1beta, and use gemini-2.5-flash model
        const modelName = 'gemini-2.5-flash';
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Gemini API error response:", errorData);
            
            // If gemini-2.5-flash fails, try gemini-1.5-pro as fallback
            if (response.status === 404 && modelName === 'gemini-2.5-flash') {
                console.log("Trying gemini-1.5-pro as fallback...");
                const fallbackResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: fullPrompt
                                }]
                            }]
                        })
                    }
                );
                
                if (!fallbackResponse.ok) {
                    const fallbackErrorData = await fallbackResponse.json().catch(() => ({}));
                    console.error("Gemini API fallback error:", fallbackErrorData);
                    throw new Error(`Gemini API error: ${fallbackResponse.status} ${fallbackResponse.statusText}. ${JSON.stringify(fallbackErrorData)}`);
                }
                
                const fallbackData = await fallbackResponse.json();
                const generatedText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!generatedText) {
                    console.error("No text in Gemini fallback response:", fallbackData);
                    throw new Error('No response text from Gemini API');
                }
                
                return generatedText;
            }
            
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log("Gemini API response:", data);
        
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generatedText) {
            console.error("No text in Gemini response:", data);
            throw new Error('No response text from Gemini API');
        }

        return generatedText;
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        // Fallback response if API fails
        return "I apologize, but I'm having trouble processing your request right now. Please try again later or contact support for assistance.";
    }
}

/**
 * Flag a knowledge base entry
 */
export async function flagKnowledgeBaseEntry(entryId: string): Promise<void> {
    try {
        const entryRef = doc(db, 'knowledgebase', entryId);
        await updateDoc(entryRef, {
            isFlagged: true
        });
    } catch (error: any) {
        console.error("Error flagging knowledge base entry:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Get all knowledge base entries
 */
export async function getAllKnowledgeBaseEntries(): Promise<KnowledgeBaseEntry[]> {
    try {
        const knowledgeBaseRef = collection(db, 'knowledgebase');
        const snapshot = await getDocs(knowledgeBaseRef);
        
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                question: data.question,
                answer: data.answer,
                authorId: data.authorId,
                category: data.category,
                rating: data.rating || 0,
                ratingCount: data.ratingCount || 0,
                isFlagged: data.isFlagged || false,
                createdAt: data.createdAt?.toDate() || new Date()
            };
        });
    } catch (error: any) {
        console.error("Error fetching knowledge base entries:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Get flagged knowledge base entries
 */
export async function getFlaggedKnowledgeBaseEntries(): Promise<KnowledgeBaseEntry[]> {
    try {
        const knowledgeBaseRef = collection(db, 'knowledgebase');
        const q = query(knowledgeBaseRef, where('isFlagged', '==', true));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                question: data.question,
                answer: data.answer,
                authorId: data.authorId,
                category: data.category,
                rating: data.rating || 0,
                ratingCount: data.ratingCount || 0,
                isFlagged: data.isFlagged || false,
                createdAt: data.createdAt?.toDate() || new Date()
            };
        });
    } catch (error: any) {
        console.error("Error fetching flagged knowledge base entries:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Delete a knowledge base entry
 */
export async function deleteKnowledgeBaseEntry(entryId: string): Promise<void> {
    try {
        const entryRef = doc(db, 'knowledgebase', entryId);
        await deleteDoc(entryRef);
    } catch (error: any) {
        console.error("Error deleting knowledge base entry:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Ban an author from providing answers
 * This stores the banned author ID in a separate collection
 */
export async function banAuthorFromKnowledgeBase(authorId: string): Promise<void> {
    try {
        const bannedAuthorsRef = collection(db, 'bannedKnowledgeBaseAuthors');
        await addDoc(bannedAuthorsRef, {
            authorId,
            bannedAt: Timestamp.now()
        });
    } catch (error: any) {
        console.error("Error banning author:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Check if an author is banned
 * Returns false if check fails (e.g., insufficient permissions for visitors)
 */
export async function isAuthorBanned(authorId: string): Promise<boolean> {
    try {
        const bannedAuthorsRef = collection(db, 'bannedKnowledgeBaseAuthors');
        const q = query(bannedAuthorsRef, where('authorId', '==', authorId));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error: any) {
        // Handle permission errors gracefully - visitors may not have access
        if (error.message?.includes('permission') || error.message?.includes('Permission') || 
            error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
            console.log("Cannot check author ban status (likely visitor), assuming not banned:", error.message);
            return false; // Assume not banned if we can't check
        }
        console.error("Error checking if author is banned:", error.message);
        return false; // Default to not banned on error
    }
}