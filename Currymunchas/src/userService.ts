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

import { collection, doc, getDoc, query, setDoc, where, getDocs} from 'firebase/firestore';
import { db } from './lib/firebase';

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
        await setDoc(doc(db, 'users', user.uid), {
            name,
            email,
            role,
            createdAt: new Date()
        });
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
        const q = query(usersRef, where('role', '==', 'Customer')); // query for where role === visitors
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

// Function to make employee accounts for chefs and delivery people by manager
export async function createEmployeeAccount(email: string, password: string, name: string, role: string, managerId: string) {
    try {
        const managerRef = doc(db, 'users', managerId);
        const managerSnap = await getDoc(managerRef);

        if (!managerSnap.exists()) {
            throw new Error('Manager not found.');
        }
        const managerData = managerSnap.data();
        if (managerData.role !== 'manager') {
            throw new Error('Access denied. Only managers can create employee accounts.');
        }

        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional user info in Firestore
        if (role === 'chef'){
            await setDoc(doc(db, 'users', user.uid), {
                name,
                email,
                role,
                averageRating: 0,
                salary: 60000,
                status: 'active',
                createdAt: new Date(),
                createdBy: managerId
            });
        }
        else if (role === 'delivery'){
            await setDoc(doc(db, 'users', user.uid), {
                name,
                email,
                role,
                averageRating: 0,
                salary: 40000,
                deliveries: 0,
                createdAt: new Date(),
                createdBy: managerId
            });
        } else {
            throw new Error('Invalid role specified for employee account.');
        }

        console.log('Employee account created:', user);
        return user;
    } catch (error: any) {
        console.log("Error creating employee account:", error.message);
        throw new Error(error.message);
    }
}

// Function to get all chef employees
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
        const usersRef = collection(db, 'users'); // reference to users collection
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