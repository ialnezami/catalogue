import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  stock?: number;
  sku?: string;
}

interface CartState {
  platform: string | null;
  items: CartItem[];
  discount: number;
  tax: number;
  setPlatform: (platform: string) => void;
  addItem: (product: any) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  setDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

// Helper to get storage key for platform-specific cart
const getStorageKey = (platform: string) => `cart_${platform}`;

// Get current platform from URL or sessionStorage
const getCurrentPlatform = (): string => {
  if (typeof window === 'undefined') return 'default';
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('platform') || sessionStorage.getItem('currentPlatform') || 'default';
};

// Custom storage that handles platform-specific carts
const createPlatformStorage = () => {
  return {
    getItem: (name: string): string | null => {
      const platform = getCurrentPlatform();
      const key = getStorageKey(platform);
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    },
    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined') return;
      const platform = getCurrentPlatform();
      const key = getStorageKey(platform);
      localStorage.setItem(key, value);
    },
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      const platform = getCurrentPlatform();
      const key = getStorageKey(platform);
      localStorage.removeItem(key);
    },
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      platform: null,
      items: [],
      discount: 0,
      tax: 0,

      setPlatform: (platform: string) => {
        // Save current cart before switching
        const currentPlatform = get().platform || getCurrentPlatform();
        if (currentPlatform && currentPlatform !== platform) {
          const currentKey = getStorageKey(currentPlatform);
          const currentState = {
            state: {
              items: get().items,
              discount: get().discount,
              tax: get().tax,
              platform: currentPlatform,
            },
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(currentKey, JSON.stringify(currentState));
          }
        }
        
        // Load cart for the new platform
        const storageKey = getStorageKey(platform);
        const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            set({
              platform,
              items: parsed.state?.items || [],
              discount: parsed.state?.discount || 0,
              tax: parsed.state?.tax || 0,
            });
          } catch (e) {
            set({ platform, items: [], discount: 0, tax: 0 });
          }
        } else {
          set({ platform, items: [], discount: 0, tax: 0 });
        }
        
        // Update sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentPlatform', platform);
        }
      },

  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item._id === product._id || item._id === product.id);
    
    if (existingItem) {
      // Increase quantity if item exists
      set({
        items: items.map((item) =>
          item._id === (product._id || product.id)
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        ),
      });
    } else {
      // Add new item
      const newItem: CartItem = {
        _id: product._id || product.id,
        name: product.name || product.title,
        price: product.price,
        quantity: 1,
        discount: 0,
        subtotal: product.price,
        stock: product.stock || product.qty,
        sku: product.sku,
      };
      set({ items: [...items, newItem] });
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((item) => item._id !== id) });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set({
      items: get().items.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      ),
    });
  },

  updateItemDiscount: (id, discount) => {
    set({
      items: get().items.map((item) => {
        if (item._id === id) {
          const subtotal = item.quantity * item.price;
          return {
            ...item,
            discount,
            subtotal: subtotal - discount,
          };
        }
        return item;
      }),
    });
  },

  setDiscount: (discount) => set({ discount }),

  setTax: (tax) => set({ tax }),

      clearCart: () => set({ items: [], discount: 0, tax: 0 }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return subtotal - get().discount + get().tax;
      },
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => createPlatformStorage()),
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
        tax: state.tax,
        platform: state.platform,
      }),
    }
  )
);

