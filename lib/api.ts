const API_BASE = '/api';

export const productsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/products`);
    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      id: item._id?.toString() || item.id,
    }));
  },

  getByQR: async (code: string) => {
    const products = await productsAPI.getAll();
    return products.find((p: any) => p.barcode === code || p.qrCode === code);
  },

  getBySKU: async (code: string) => {
    const products = await productsAPI.getAll();
    return products.find((p: any) => p.sku === code);
  },
};

export const ordersAPI = {
  create: async (orderData: any) => {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return response.json();
  },
};

export const customersAPI = {
  getAll: async () => {
    // Mock for now - you can add real API later
    return [];
  },

  create: async (customerData: any) => {
    // Mock for now
    return { ...customerData, _id: Date.now().toString(), loyaltyPoints: 0 };
  },

  useLoyaltyPoints: async (customerId: string, points: number) => {
    // Mock implementation
  },

  addLoyaltyPoints: async (customerId: string, points: number) => {
    // Mock implementation
  },

  addDebt: async (customerId: string, amount: number, orderId: string, note: string) => {
    // Mock implementation
  },
};

