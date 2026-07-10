import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Global Cart Store
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  quantity: number;
  total: number; // total = price * quantity
}

let cartItems: CartItem[] = [];
let discountPercent = 0;
const cartListeners = new Set<(items: CartItem[]) => void>();

export const CartStore = {
  getCartItems: () => cartItems,
  getDiscountPercent: () => discountPercent,
  setDiscountPercent: (percent: number) => {
    discountPercent = percent;
    cartListeners.forEach(listener => listener([...cartItems]));
    CartStore.syncToFirestore();
  },
  getCartCount: () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  },
  addToCart: (product: any, quantity: number = 1) => {
    if (!product || !product.id) return;
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.price * existingItem.quantity;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name || product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        rating: product.rating || 4.5,
        quantity: quantity,
        total: product.price * quantity,
      });
    }
    cartListeners.forEach(listener => listener([...cartItems]));
    CartStore.syncToFirestore();
  },
  clearCart: () => {
    cartItems = [];
    discountPercent = 0;
    cartListeners.forEach(listener => listener([]));
    const user = SessionStore.getUser();
    if (user) {
      CartStore.syncToFirestore();
    }
  },
  incrementQuantity: (productId: string) => {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
      item.quantity += 1;
      item.total = item.price * item.quantity;
      cartListeners.forEach(listener => listener([...cartItems]));
      CartStore.syncToFirestore();
    }
  },
  decrementQuantity: (productId: string) => {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
        item.total = item.price * item.quantity;
      } else {
        cartItems = cartItems.filter(item => item.id !== productId);
      }
      cartListeners.forEach(listener => listener([...cartItems]));
      CartStore.syncToFirestore();
    }
  },
  removeItem: (productId: string) => {
    cartItems = cartItems.filter(item => item.id !== productId);
    cartListeners.forEach(listener => listener([...cartItems]));
    CartStore.syncToFirestore();
  },
  syncToFirestore: async () => {
    const user = SessionStore.getUser();
    if (!user || !user.email) return;
    try {
      const cartRef = doc(db, 'carts', user.email.toLowerCase());
      if (cartItems.length === 0) {
        await deleteDoc(cartRef);
      } else {
        await setDoc(cartRef, {
          items: cartItems,
          discountPercent,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Error syncing cart to Firestore:', e);
    }
  },
  loadFromFirestore: async () => {
    const user = SessionStore.getUser();
    if (!user || !user.email) return;
    try {
      const cartRef = doc(db, 'carts', user.email.toLowerCase());
      const snap = await getDoc(cartRef);
      if (snap.exists()) {
        const data = snap.data();
        cartItems = (data.items || []).map((item: any) => ({
          ...item,
          total: item.total || (item.price * item.quantity)
        }));
        discountPercent = data.discountPercent || 0;
      } else {
        cartItems = [];
        discountPercent = 0;
      }
      cartListeners.forEach(listener => listener([...cartItems]));
    } catch (e) {
      console.error('Error loading cart from Firestore:', e);
    }
  },
  subscribe: (listener: (items: CartItem[]) => void) => {
    cartListeners.add(listener);
    return () => {
      cartListeners.delete(listener);
    };
  }
};

export function useCartCount() {
  const [count, setCount] = useState(CartStore.getCartCount());

  useEffect(() => {
    return CartStore.subscribe(() => {
      setCount(CartStore.getCartCount());
    });
  }, []);

  return count;
}

export function useCartItems() {
  const [items, setItems] = useState(CartStore.getCartItems());

  useEffect(() => {
    return CartStore.subscribe(newItems => {
      setItems(newItems);
    });
  }, []);

  return items;
}

// Global Region Store
let selectedStateId = 'delhi';
let selectedStateName = 'Delhi';
const regionListeners = new Set<(state: { id: string; name: string }) => void>();

export const RegionStore = {
  getState: () => ({ id: selectedStateId, name: selectedStateName }),
  setState: (id: string, name: string) => {
    selectedStateId = id;
    selectedStateName = name;
    regionListeners.forEach(listener => listener({ id: selectedStateId, name: selectedStateName }));
  },
  subscribe: (listener: (state: { id: string; name: string }) => void) => {
    regionListeners.add(listener);
    return () => {
      regionListeners.delete(listener);
    };
  }
};

export function useRegionState() {
  const [state, setState] = useState(RegionStore.getState());

  useEffect(() => {
    return RegionStore.subscribe(newState => {
      setState(newState);
    });
  }, []);

  return state;
}

// Global User Session Store
export interface SessionUser {
  name: string;
  email: string;
  mobile?: string;
}

let currentUser: SessionUser | null = null;
const sessionListeners = new Set<(user: SessionUser | null) => void>();

export const SessionStore = {
  getUser: () => currentUser,
  setUser: (user: SessionUser | null) => {
    currentUser = user;
    sessionListeners.forEach(listener => listener(currentUser));
    if (user) {
      CartStore.loadFromFirestore();
    } else {
      CartStore.clearCart();
    }
  },
  subscribe: (listener: (user: SessionUser | null) => void) => {
    sessionListeners.add(listener);
    return () => {
      sessionListeners.delete(listener);
    };
  }
};

export function useSessionState() {
  const [user, setUser] = useState(SessionStore.getUser());

  useEffect(() => {
    return SessionStore.subscribe(newUser => {
      setUser(newUser);
    });
  }, []);

  return user;
}
