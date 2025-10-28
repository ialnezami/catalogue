import { create } from 'zustand';

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
  items: CartItem[];
  discount: number;
  tax: number;
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

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  tax: 0,

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
}));

