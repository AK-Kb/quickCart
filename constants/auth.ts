import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface User {
  name: string;
  mobile: string;
  password?: string;
  createdAt?: string;
}

export const AuthStore = {
  // Register a new user in Firestore users collection
  register: async (name: string, mobile: string, password?: string): Promise<boolean> => {
    if (!mobile || !password) return false;
    try {
      const userRef = doc(db, 'users', mobile);
      await setDoc(userRef, {
        fullName: name,
        mobile,
        password,
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Firestore register error:', error);
      return false;
    }
  },
  
  // Login verification using Firestore document
  login: async (mobile: string, password?: string): Promise<User | null> => {
    if (!mobile || !password) return null;
    try {
      const userRef = doc(db, 'users', mobile);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === password) {
          return { name: userData.fullName, mobile: userData.mobile };
        }
      }
      return null;
    } catch (error) {
      console.error('Firestore login error:', error);
      return null;
    }
  },

  // Check if user already exists
  userExists: async (mobile: string): Promise<boolean> => {
    if (!mobile) return false;
    try {
      const userRef = doc(db, 'users', mobile);
      const userSnap = await getDoc(userRef);
      return userSnap.exists();
    } catch (error) {
      console.error('Firestore userExists error:', error);
      return false;
    }
  },

  // Reset/update password in Firestore doc
  resetPassword: async (mobile: string, newPassword?: string): Promise<boolean> => {
    if (!mobile || !newPassword) return false;
    try {
      const userRef = doc(db, 'users', mobile);
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
