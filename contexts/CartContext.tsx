import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { CartContextType, Product, CartItem } from '@/types';

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to get storage key for platform-specific cart
const getStorageKey = (platform: string) => `cart_context_${platform}`;

// Get current platform from URL or sessionStorage
const getCurrentPlatform = (): string => {
  if (typeof window === 'undefined') return 'default';
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('platform') || sessionStorage.getItem('currentPlatform') || 'default';
};

// Load cart from localStorage for current platform
const loadCartForPlatform = (platform: string): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getStorageKey(platform));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save cart to localStorage for current platform
const saveCartForPlatform = (platform: string, items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(platform), JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentPlatform, setCurrentPlatform] = useState<string>('default');
  const cartItemsRef = useRef<CartItem[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Initialize cart for current platform
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const platform = getCurrentPlatform();
    sessionStorage.setItem('currentPlatform', platform);
    setCurrentPlatform(platform);
    
    const loadedItems = loadCartForPlatform(platform);
    setCartItems(loadedItems);
    cartItemsRef.current = loadedItems;
  }, []);

  // Watch for platform changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkPlatform = () => {
      const platform = getCurrentPlatform();
      if (platform !== currentPlatform) {
        // Save current cart before switching (use ref to avoid stale closure)
        saveCartForPlatform(currentPlatform, cartItemsRef.current);
        
        // Load cart for new platform
        const loadedItems = loadCartForPlatform(platform);
        setCurrentPlatform(platform);
        setCartItems(loadedItems);
        cartItemsRef.current = loadedItems;
      }
    };
    
    // Check periodically and on navigation
    const interval = setInterval(checkPlatform, 500);
    window.addEventListener('popstate', checkPlatform);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', checkPlatform);
    };
  }, [currentPlatform]);

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      const newItems = existingItem
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { product, quantity: 1 }];
      
      // Save to localStorage
      saveCartForPlatform(currentPlatform, newItems);
      return newItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => {
      const newItems = prev.filter((item) => item.product.id !== productId);
      saveCartForPlatform(currentPlatform, newItems);
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) => {
      const newItems = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      saveCartForPlatform(currentPlatform, newItems);
      return newItems;
    });
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartForPlatform(currentPlatform, []);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

