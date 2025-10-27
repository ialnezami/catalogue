import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FileText, Calendar, DollarSign, ShoppingBag, LogOut, Home, X } from 'lucide-react';
import { useRouter } from 'next/router';

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentAmount: number;
  change: number;
  timestamp: Date;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getTotalOrders = () => orders.length;
  
  const getTotalRevenue = () => orders.reduce((sum, order) => sum + order.total, 0);
  
  const getTotalItems = () => orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: '#9ca3af' }}>Loading orders...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#ec4899' }}>Orders History</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => router.push('/pos')}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            <ShoppingBag size={20} />
            POS
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            <Home size={20} />
            Products
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <FileText size={32} color="#3b82f6" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>Total Orders</h3>
          </div>
          <p style={{ color: '#ec4899', fontSize: '2rem', fontWeight: 'bold' }}>{getTotalOrders()}</p>
        </div>
        
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <DollarSign size={32} color="#10b981" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>Total Revenue</h3>
          </div>
          <p style={{ color: '#ec4899', fontSize: '2rem', fontWeight: 'bold' }}>${getTotalRevenue().toFixed(2)}</p>
        </div>
        
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <ShoppingBag size={32} color="#ec4899" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>Items Sold</h3>
          </div>
          <p style={{ color: '#ec4899', fontSize: '2rem', fontWeight: 'bold' }}>{getTotalItems()}</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem' }}>Recent Orders</h2>
        
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>No orders yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                style={{
                  backgroundColor: '#2a2a2a',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.borderColor = '#ec4899';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                  e.currentTarget.style.borderColor = '#374151';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Calendar size={20} color="#9ca3af" />
                    <span style={{ color: '#d1d5db' }}>{formatDate(order.timestamp)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#ec4899', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', color: '#9ca3af' }}>
                  {order.items.length} item(s) • Discount: ${order.discount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #374151',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '0.5rem',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              <p><strong>Date:</strong> {formatDate(selectedOrder.timestamp)}</p>
            </div>

            <h3 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '1rem' }}>Items:</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#2a2a2a',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ color: '#ffffff' }}>{item.title}</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      {item.quantity}x ${item.price.toFixed(2)}
                      {item.discount > 0 && ` - $${item.discount.toFixed(2)} discount`}
                    </p>
                  </div>
                  <p style={{ color: '#ec4899', fontWeight: 'bold' }}>${item.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>Subtotal:</span>
                <span style={{ color: '#ffffff' }}>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>Discount:</span>
                <span style={{ color: '#10b981' }}>-${selectedOrder.discount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>Total:</span>
                <span style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '1.25rem' }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>Payment:</span>
                <span style={{ color: '#ffffff' }}>${selectedOrder.paymentAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#d1d5db' }}>Change:</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>${selectedOrder.change.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

