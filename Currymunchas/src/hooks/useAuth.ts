import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockChefs, mockDeliveryPeople, mockManager, mockCustomers } from '../lib/mockData';
import { logInUser, signUpUser, logOutUser, signUpEmployee} from '../userService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
/**
 * Mock authentication hook
 * In production, this would integrate with Firebase Auth
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      console.warn('Firebase not configured, using mock mode');
      setIsLoading(false);
      return;
    }
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // First check the users collection (for customers, visitors, manager)
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              setCurrentUser({ ...userData, id: user.uid });
            } else {
              // If not found in users, check the employees collection (for chefs and delivery)
              const employeeDoc = await getDoc(doc(db, 'employees', user.uid));
              if (employeeDoc.exists()) {
                const employeeData = employeeDoc.data() as User;
                setCurrentUser({ ...employeeData, id: user.uid });
              } else {
                setCurrentUser(null);
              }
            }
          } catch (error) {
            console.warn('Error fetching user data:', error);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.warn('Firebase Auth initialization error:', error);
      setIsLoading(false);
    }
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

  const refreshUser = async () => {
    if (!auth || !db) {
      return;
    }
    const user = auth.currentUser;
    if (user) {
      // First check the users collection (for customers, visitors, manager)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setCurrentUser({ ...userData, id: user.uid });
      } else {
        // If not found in users, check the employees collection (for chefs and delivery)
        const employeeDoc = await getDoc(doc(db, 'employees', user.uid));
        if (employeeDoc.exists()) {
          const employeeData = employeeDoc.data() as User;
          setCurrentUser({ ...employeeData, id: user.uid });
        } else {
          setCurrentUser(null);
        }
      }
    }
  };

  return {
    currentUser,
    isLoading,
    login,
    logout,
    register,
    refreshUser,
    isAuthenticated: !!currentUser
  };
}
