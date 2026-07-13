import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface User {
  name: string;
  email: string;
  mobile?: string;
  password?: string;
  createdAt?: string;
  role?: string;
}

export const AuthStore = {
  // Register a new user in Firestore users collection
  register: async (name: string, email: string, password?: string, mobile?: string): Promise<boolean> => {
    if (!email || !password) return false;
    try {
      const userRef = doc(db, 'users', email.toLowerCase());
      await setDoc(userRef, {
        fullName: name,
        email: email.toLowerCase(),
        mobile: mobile || '',
        password,
        createdAt: new Date().toISOString(),
        role: 'customer' // default role is customer
      });
      return true;
    } catch (error) {
      console.error('Firestore register error:', error);
      return false;
    }
  },
  
  // Login verification using Firestore document
  login: async (email: string, password?: string): Promise<User | null> => {
    if (!email || !password) return null;
    try {
      const userRef = doc(db, 'users', email.toLowerCase());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === password) {
          return {
            name: userData.fullName,
            email: userData.email,
            mobile: userData.mobile,
            role: userData.role || 'customer'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Firestore login error:', error);
      return null;
    }
  },

  // Check if user already exists by email
  userExists: async (email: string): Promise<boolean> => {
    if (!email) return false;
    try {
      const userRef = doc(db, 'users', email.toLowerCase());
      const userSnap = await getDoc(userRef);
      return userSnap.exists();
    } catch (error) {
      console.error('Firestore userExists error:', error);
      return false;
    }
  },

  // Reset/update password in Firestore doc
  resetPassword: async (email: string, newPassword?: string): Promise<boolean> => {
    if (!email || !newPassword) return false;
    try {
      const userRef = doc(db, 'users', email.toLowerCase());
      await updateDoc(userRef, {
        password: newPassword,
      });
      return true;
    } catch (error) {
      console.error('Firestore resetPassword error:', error);
      return false;
    }
  }
};
