export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  barcode?: string;   // Admin only - product barcode
  buyPrice?: number;  // Admin only - cost price
  note?: string;       // Admin only - internal notes
  qty?: number;       // Admin only - stock quantity
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

