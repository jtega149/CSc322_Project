# Firebase Integration Guide

This guide will help you integrate Firebase into the AI Restaurant application.

## 📋 Prerequisites

1. Node.js and npm installed
2. A Google account for Firebase
3. Firebase CLI (optional but recommended)

## 🚀 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "AI Restaurant" (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## 🔧 Step 2: Enable Firebase Services

### Authentication
1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. (Optional) Enable **Google** sign-in for easier testing

### Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (we'll add security rules later)
4. Choose a location close to your users
5. Click "Enable"

### Storage
1. Go to **Storage**
2. Click "Get started"
3. Start in **test mode**
4. Click "Done"

## 📦 Step 3: Install Firebase SDK

```bash
npm install firebase
```

## 🔐 Step 4: Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register your app (name: "AI Restaurant Web")
5. Copy the `firebaseConfig` object

## 📝 Step 5: Create Firebase Configuration File

Create `/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
```

**Important**: Never commit your Firebase config to public repositories. Use environment variables:

Create `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Update `firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## 🗄️ Step 6: Firestore Database Schema

### Collections Structure

```
users/
  {userId}/
    - email: string
    - name: string
    - role: 'customer' | 'vip' | 'chef' | 'delivery' | 'manager'
    - createdAt: timestamp
    - accountBalance: number
    - totalSpent: number
    - orderCount: number
    - isBlacklisted: boolean
    - freeDeliveriesEarned: number
    - freeDeliveriesUsed: number
    - salary: number (for employees)
    - averageRating: number (for chefs/delivery)
    
warnings/
  {warningId}/
    - userId: string
    - reason: string
    - issuedAt: timestamp
    - relatedComplaintId: string?

dishes/
  {dishId}/
    - name: string
    - description: string
    - price: number
    - imageUrl: string
    - chefId: string
    - category: string
    - isVIPOnly: boolean
    - isAvailable: boolean
    - averageRating: number
    - orderCount: number
    - createdAt: timestamp

orders/
  {orderId}/
    - customerId: string
    - items: array
    - totalPrice: number
    - deliveryFee: number
    - discount: number
    - finalPrice: number
    - status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered'
    - chefId: string?
    - deliveryPersonId: string?
    - createdAt: timestamp
    - deliveredAt: timestamp?

deliveryBids/
  {bidId}/
    - orderId: string
    - deliveryPersonId: string
    - bidAmount: number
    - timestamp: timestamp

ratings/
  {ratingId}/
    - userId: string
    - orderId: string
    - dishId: string
    - deliveryPersonId: string?
    - foodRating: number
    - deliveryRating: number
    - comment: string
    - createdAt: timestamp

complaints/
  {complaintId}/
    - type: 'complaint' | 'compliment'
    - reporterId: string
    - targetId: string
    - targetType: 'chef' | 'delivery' | 'customer'
    - orderId: string?
    - reason: string
    - status: 'pending' | 'under_review' | 'disputed' | 'resolved_valid' | 'resolved_invalid'
    - isDisputed: boolean
    - disputeReason: string?
    - managerNotes: string?
    - weight: number
    - createdAt: timestamp
    - resolvedAt: timestamp?

discussions/
  {topicId}/
    - authorId: string
    - title: string
    - content: string
    - category: 'chef' | 'dish' | 'delivery' | 'general'
    - relatedId: string?
    - createdAt: timestamp
    
    posts/
      {postId}/
        - authorId: string
        - content: string
        - createdAt: timestamp

knowledgeBase/
  {entryId}/
    - question: string
    - answer: string
    - authorId: string
    - category: string
    - rating: number
    - ratingCount: number
    - isFlagged: boolean
    - createdAt: timestamp

transactions/
  {transactionId}/
    - userId: string
    - type: 'deposit' | 'order' | 'refund' | 'withdrawal'
    - amount: number
    - balanceBefore: number
    - balanceAfter: number
    - orderId: string?
    - description: string
    - timestamp: timestamp

hrActions/
  {actionId}/
    - managerId: string
    - targetId: string
    - actionType: 'hire' | 'fire' | 'raise' | 'cut_pay' | 'promote' | 'demote' | 'bonus'
    - previousSalary: number?
    - newSalary: number?
    - reason: string
    - memo: string?
    - timestamp: timestamp
```

## 🔒 Step 7: Security Rules

In Firebase Console, go to **Firestore Database** > **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isManager() {
      return isSignedIn() && getUserRole() == 'manager';
    }
    
    function isChef() {
      return isSignedIn() && getUserRole() == 'chef';
    }
    
    function isDelivery() {
      return isSignedIn() && getUserRole() == 'delivery';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner(userId) || isManager();
      allow delete: if isManager();
    }
    
    // Dishes collection
    match /dishes/{dishId} {
      allow read: if true; // Anyone can view menu
      allow create, update, delete: if isChef() || isManager();
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner(resource.data.customerId) || isManager() || isChef() || isDelivery();
    }
    
    // Complaints collection
    match /complaints/{complaintId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isManager() || isOwner(resource.data.reporterId) || isOwner(resource.data.targetId);
    }
    
    // Discussions collection
    match /discussions/{topicId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.authorId) || isManager();
      
      match /posts/{postId} {
        allow read: if true;
        allow create: if isSignedIn();
        allow update, delete: if isOwner(resource.data.authorId) || isManager();
      }
    }
    
    // Knowledge Base
    match /knowledgeBase/{entryId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isManager() || isOwner(resource.data.authorId);
    }
    
    // Transactions (read-only for users, write for system)
    match /transactions/{transactionId} {
      allow read: if isOwner(resource.data.userId) || isManager();
      allow create: if isSignedIn();
    }
    
    // HR Actions (manager only)
    match /hrActions/{actionId} {
      allow read: if isManager() || isOwner(resource.data.targetId);
      allow create: if isManager();
    }
    
    // Warnings
    match /warnings/{warningId} {
      allow read: if isOwner(resource.data.userId) || isManager();
      allow create, update: if isManager();
    }
  }
}
```

## 🔄 Step 8: Update Authentication Hook

Update `/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        name,
        role: 'visitor', // Needs manager approval
        createdAt: new Date(),
        accountBalance: 0,
        totalSpent: 0,
        orderCount: 0,
        isBlacklisted: false,
        freeDeliveriesEarned: 0,
        freeDeliveriesUsed: 0
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  return {
    currentUser,
    isLoading,
    login,
    logout,
    register,
    isAuthenticated: !!currentUser
  };
}
```

## 🤖 Step 9: LLM Integration with Firebase Functions

Install Firebase Functions:
```bash
npm install -g firebase-tools
firebase init functions
```

Create a function for LLM (`functions/src/index.ts`):

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Using Hugging Face API
export const getLLMResponse = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { question } = data;

  try {
    // First, search knowledge base
    const kbSnapshot = await admin.firestore()
      .collection('knowledgeBase')
      .where('question', '>=', question.toLowerCase())
      .limit(1)
      .get();

    if (!kbSnapshot.empty) {
      const kbEntry = kbSnapshot.docs[0].data();
      return {
        response: kbEntry.answer,
        source: 'knowledge_base',
        entryId: kbSnapshot.docs[0].id
      };
    }

    // Fallback to Hugging Face LLM
    const HF_API_KEY = functions.config().huggingface.key;
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: `You are a helpful restaurant assistant. Answer the following question: ${question}`,
          parameters: {
            max_length: 200,
            temperature: 0.7
          }
        })
      }
    );

    const result = await response.json();
    
    return {
      response: result[0].generated_text,
      source: 'llm'
    };
  } catch (error) {
    console.error('LLM error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get response');
  }
});

// Set Hugging Face API key
// firebase functions:config:set huggingface.key="your_hf_api_key"
```

## 🎨 Step 10: Image Upload for Dishes

Update dish creation to include image upload:

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

async function uploadDishImage(file: File, dishId: string): Promise<string> {
  const storageRef = ref(storage, `dishes/${dishId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
```

## ✅ Testing Your Integration

1. Start your development server
2. Try registering a new user
3. Check Firebase Console > Authentication to see the new user
4. Check Firestore to see the user document
5. Test login/logout functionality
6. Try creating dishes, orders, etc.

## 🐛 Common Issues

### Issue: "Firebase not defined"
**Solution**: Make sure you've imported firebase in your component

### Issue: "Permission denied"
**Solution**: Check your Firestore security rules

### Issue: "API key not valid"
**Solution**: Regenerate your Firebase config from the console

### Issue: "Storage CORS error"
**Solution**: Set up CORS for Firebase Storage:
```bash
firebase deploy --only storage
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Hugging Face API](https://huggingface.co/docs/api-inference/index)

## 🎯 Next Steps

1. Set up Firebase project
2. Configure environment variables
3. Update authentication hooks
4. Test user registration and login
5. Implement Firestore CRUD operations
6. Set up Firebase Functions for LLM
7. Add image upload functionality
8. Deploy to Firebase Hosting
