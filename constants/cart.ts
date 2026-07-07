import { useState, useEffect } from 'react';

// Global Cart Store
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  quantity: number;
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
  },
  getCartCount: () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  },
  addToCart: (product: any, quantity: number = 1) => {
    if (!product || !product.id) return;
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        rating: product.rating,
        quantity: quantity,
      });
    }
    cartListeners.forEach(listener => listener([...cartItems]));
  },
  clearCart: () => {
    cartItems = [];
    discountPercent = 0;
    cartListeners.forEach(listener => listener([]));
  },
  incrementQuantity: (productId: string) => {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
      item.quantity += 1;
      cartListeners.forEach(listener => listener([...cartItems]));
    }
  },
  decrementQuantity: (productId: string) => {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        cartItems = cartItems.filter(item => item.id !== productId);
      }
      cartListeners.forEach(listener => listener([...cartItems]));
    }
  },
  removeItem: (productId: string) => {
    cartItems = cartItems.filter(item => item.id !== productId);
    cartListeners.forEach(listener => listener([...cartItems]));
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
let currentUser: { name: string; mobile: string } | null = null;
const sessionListeners = new Set<(user: { name: string; mobile: string } | null) => void>();

export const SessionStore = {
  getUser: () => currentUser,
  setUser: (user: { name: string; mobile: string } | null) => {
    currentUser = user;
    sessionListeners.forEach(listener => listener(currentUser));
  },
  subscribe: (listener: (user: { name: string; mobile: string } | null) => void) => {
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
