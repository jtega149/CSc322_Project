import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockChefs, mockDeliveryPeople, mockManager, mockCustomers } from '../lib/mockData';
import { logInUser, signUpUser, logOutUser } from '../userService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
/**
 * Mock authentication hook
 * In production, this would integrate with Firebase Auth
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setCurrentUser(userData);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = await logInUser(email, password);
    if (!user) {
      console.log("Login failed");
      return false;
    }
    return true;
  };

  const logout = async () => {
    logOutUser();
    setCurrentUser(null);
  };

  const register = async (email: string, password: string, name: string, role="visitor"): Promise<boolean> => {
    const user = await signUpUser(email, password, name, role);
    if (!user) {
      console.log("Registration failed");
      return false;
    }
    // In production, this would create user in Firebase
    return true;
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
