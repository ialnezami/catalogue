import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FileText, Calendar, DollarSign, ShoppingBag, LogOut, Home, X, CheckCircle, XCircle, Clock, BarChart3, TrendingUp, Download, Filter } from 'lucide-react';
import { useRouter } from 'next/router';
import { getCurrencySettings, formatPrice, CURRENCY_SYMBOLS } from '@/lib/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OrderItem {
  productId: string;
  title: string;
  price: number; // USD price
  buyPrice?: number; // Cost price in USD
  quantity: number;
  subtotal: number; // USD subtotal
  profit?: number; // Profit in USD
}

interface Order {
  _id: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  totalProfit?: number;
  status?: 'pending' | 'accepted' | 'rejected';
  source?: 'pos' | 'cart'; // Track where order came from
  exchangeRate?: number;
  displayCurrency?: string;
  currency?: string;
  paymentAmount: number;
  change: number;
  timestamp: Date;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [displayCurrency, setDisplayCurrency] = useState('SP');
  const [currency, setCurrency] = useState('USD');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState(false);
  const router = useRouter();
  const { t, language } = useLanguage();

  useEffect(() => {
    // Get platform from admin session
    const loadAdminPlatform = async () => {
      try {
        const authResponse = await fetch('/api/auth/check');
        const authData = await authResponse.json();
        
        if (authData.adminPlatform) {
          setPlatform(authData.adminPlatform);
        } else {
          // Fallback to URL parameter or default
          const urlParams = new URLSearchParams(window.location.search);
          const platformParam = urlParams.get('platform') || 'default';
          setPlatform(platformParam);
        }
      } catch (error) {
        console.error('Error fetching admin platform:', error);
        const urlParams = new URLSearchParams(window.location.search);
        const platformParam = urlParams.get('platform') || 'default';
        setPlatform(platformParam);
      }
    };
    
    loadAdminPlatform();
  }, []);

  useEffect(() => {
    if (platform) {
      loadOrders();
      loadCurrencySettings();
    }
  }, [platform]);

  const loadCurrencySettings = async () => {
    try {
      const settings = await getCurrencySettings(platform || undefined);
      setExchangeRate(settings.exchangeRate);
      setDisplayCurrency(settings.displayCurrency);
      setCurrency(settings.currency);
    } catch (error) {
      console.error('Error loading currency settings:', error);
    }
  };

  const loadOrders = async () => {
    try {
      // API automatically uses admin's platform from cookie
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

  const updateOrderStatus = async (orderId: string, status: 'accepted' | 'rejected') => {
    setUpdatingStatus(orderId);
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status }),
      });

      if (response.ok) {
        await loadOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status });
        }
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getTotalOrders = () => filteredOrders.length;
  
  const getPendingOrders = () => filteredOrders.filter(o => o.status === 'pending').length;
  
  const getTotalRevenue = () => filteredOrders
    .filter(o => o.status === 'accepted')
    .reduce((sum, order) => sum + order.total, 0);
  
  const getTotalProfit = () => filteredOrders
    .filter(o => o.status === 'accepted')
    .reduce((sum, order) => sum + (order.totalProfit || 0), 0);
  
  const getTotalItems = () => filteredOrders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);

  // Date filtering functions
  const filterOrdersByDate = (ordersList: Order[]) => {
    if (dateFilter === 'all') return ordersList;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return ordersList.filter(order => {
      const orderDate = new Date(order.timestamp);
      
      switch (dateFilter) {
        case 'today':
          return orderDate >= today;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return orderDate >= yearAgo;
        case 'custom':
          if (!customStartDate || !customEndDate) return true;
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return orderDate >= start && orderDate <= end;
        default:
          return true;
      }
    });
  };

  const filteredOrders = filterOrdersByDate(orders);

  // Chart data preparation
  const getDailyRevenueData = () => {
    const dailyData: { [key: string]: { date: string; revenue: number; orders: number; profit: number } } = {};
    
    filteredOrders
      .filter(o => o.status === 'accepted')
      .forEach(order => {
        const date = new Date(order.timestamp).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = { date, revenue: 0, orders: 0, profit: 0 };
        }
        dailyData[date].revenue += order.total;
        dailyData[date].orders += 1;
        dailyData[date].profit += order.totalProfit || 0;
      });
    
    return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getMonthlyRevenueData = () => {
    const monthlyData: { [key: string]: { month: string; revenue: number; orders: number; profit: number } } = {};
    
    filteredOrders
      .filter(o => o.status === 'accepted')
      .forEach(order => {
        const date = new Date(order.timestamp);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { month: monthLabel, revenue: 0, orders: 0, profit: 0 };
        }
        monthlyData[month].revenue += order.total;
        monthlyData[month].orders += 1;
        monthlyData[month].profit += order.totalProfit || 0;
      });
    
    return Object.values(monthlyData).sort((a, b) => {
      const dateA = Object.keys(monthlyData).find(k => monthlyData[k].month === a.month);
      const dateB = Object.keys(monthlyData).find(k => monthlyData[k].month === b.month);
      return (dateA || '').localeCompare(dateB || '');
    });
  };

  const getStatusDistribution = () => {
    const statusCounts = {
      accepted: filteredOrders.filter(o => o.status === 'accepted').length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      rejected: filteredOrders.filter(o => o.status === 'rejected').length,
    };
    
    return [
      { name: 'Accepted', value: statusCounts.accepted, color: '#10b981' },
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Rejected', value: statusCounts.rejected, color: '#ef4444' },
    ].filter(item => item.value > 0);
  };

  const getSourceDistribution = () => {
    const sourceCounts = {
      pos: filteredOrders.filter(o => o.source === 'pos').length,
      cart: filteredOrders.filter(o => o.source === 'cart').length,
    };
    
    return [
      { name: 'POS', value: sourceCounts.pos, color: '#3b82f6' },
      { name: 'Cart', value: sourceCounts.cart, color: '#8b5cf6' },
    ].filter(item => item.value > 0);
  };

  const exportReport = () => {
    const reportData = {
      period: dateFilter === 'custom' ? `${customStartDate} to ${customEndDate}` : dateFilter,
      generatedAt: new Date().toISOString(),
      statistics: {
        totalOrders: filteredOrders.length,
        acceptedOrders: filteredOrders.filter(o => o.status === 'accepted').length,
        pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
        rejectedOrders: filteredOrders.filter(o => o.status === 'rejected').length,
        totalRevenue: filteredOrders.filter(o => o.status === 'accepted').reduce((sum, o) => sum + o.total, 0),
        totalProfit: filteredOrders.filter(o => o.status === 'accepted').reduce((sum, o) => sum + (o.totalProfit || 0), 0),
        totalItems: filteredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
      },
      orders: filteredOrders.map(o => ({
        id: o._id,
        date: new Date(o.timestamp).toISOString(),
        customer: o.customerName || 'N/A',
        status: o.status,
        source: o.source,
        total: o.total,
        profit: o.totalProfit || 0,
        items: o.items.length,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: '#9ca3af' }}>{t('admin.loadingOrders') || 'Loading orders...'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <h1 style={{ fontSize: '2.5rem', color: '#ec4899' }}>{t('admin.ordersHistory')}</h1>
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
            {t('admin.pos')}
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
            {t('admin.productsManagement')}
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
            {t('admin.logout')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <FileText size={32} color="#3b82f6" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>{t('admin.totalOrders')}</h3>
          </div>
          <p style={{ color: '#ec4899', fontSize: '2rem', fontWeight: 'bold' }}>{getTotalOrders()}</p>
        </div>
        
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Clock size={32} color="#f59e0b" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>{t('admin.pendingOrders')}</h3>
          </div>
          <p style={{ color: '#f59e0b', fontSize: '2rem', fontWeight: 'bold' }}>{getPendingOrders()}</p>
        </div>
        
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <DollarSign size={32} color="#10b981" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>{t('admin.totalRevenue')}</h3>
          </div>
          <p style={{ color: '#ec4899', fontSize: '2rem', fontWeight: 'bold' }}>
            ${getTotalRevenue().toFixed(2)}
            {displayCurrency !== 'USD' && (
              <span style={{ fontSize: '1rem', color: '#9ca3af', display: 'block', marginTop: '0.25rem' }}>
                {formatPrice(getTotalRevenue(), exchangeRate, displayCurrency)}
              </span>
            )}
          </p>
        </div>
        
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <DollarSign size={32} color="#10b981" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>{t('admin.totalProfit')}</h3>
          </div>
          <p style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>
            ${getTotalProfit().toFixed(2)}
            {displayCurrency !== 'USD' && (
              <span style={{ fontSize: '1rem', color: '#9ca3af', display: 'block', marginTop: '0.25rem' }}>
                {formatPrice(getTotalProfit(), exchangeRate, displayCurrency)}
              </span>
            )}
          </p>
        </div>
        
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <ShoppingBag size={32} color="#ec4899" />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem' }}>{t('admin.itemsSold')}</h3>
          </div>
          <p style={{ color: '#ec4899', fontSize: '2rem', fontWeight: 'bold' }}>{getTotalItems()}</p>
        </div>
      </div>

      {/* Date Filter and Report Section */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151', marginBottom: '2rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0 }}>Reports & Analytics</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <BarChart3 size={18} />
              View Reports
            </button>
            <button
              onClick={exportReport}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>
        
        {/* Date Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={18} color="#9ca3af" />
          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Filter by:</span>
          {['all', 'today', 'week', 'month', 'year', 'custom'].map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter as any)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: dateFilter === filter ? '#3b82f6' : '#374151',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textTransform: 'capitalize',
              }}
            >
              {filter === 'all' ? 'All Time' : filter}
            </button>
          ))}
        </div>
        
        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ color: '#9ca3af', fontSize: '0.875rem', marginRight: '0.5rem' }}>Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#ffffff',
                }}
              />
            </div>
            <div>
              <label style={{ color: '#9ca3af', fontSize: '0.875rem', marginRight: '0.5rem' }}>End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#ffffff',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0 }}>{t('admin.recentOrders')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                // Filter is now handled by dateFilter state
                // This button can be used for additional filtering if needed
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {t('admin.pendingOnly')}
            </button>
            <button
              onClick={() => loadOrders()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {t('admin.allOrders')}
            </button>
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
              {orders.length === 0 ? t('admin.noOrdersYet') : 'No orders found for the selected period'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredOrders.map((order) => {
              const orderExchangeRate = order.exchangeRate || exchangeRate;
              const orderDisplayCurrency = order.displayCurrency || displayCurrency;
              const statusColor = 
                order.status === 'accepted' ? '#10b981' :
                order.status === 'rejected' ? '#ef4444' :
                '#f59e0b';
              const statusIcon = 
                order.status === 'accepted' ? <CheckCircle size={20} /> :
                order.status === 'rejected' ? <XCircle size={20} /> :
                <Clock size={20} />;
              
              return (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    backgroundColor: '#2a2a2a',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${order.status === 'pending' ? '#f59e0b' : '#374151'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.borderColor = '#ec4899';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                    e.currentTarget.style.borderColor = order.status === 'pending' ? '#f59e0b' : '#374151';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <Calendar size={20} color="#9ca3af" />
                      <span style={{ color: '#d1d5db' }}>{formatDate(order.timestamp)}</span>
                      {order.customerName && (
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                          • {t('admin.customer')}: {order.customerName}
                        </span>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        backgroundColor: `${statusColor}20`,
                        border: `1px solid ${statusColor}`,
                      }}>
                        {statusIcon}
                        <span style={{ color: statusColor, fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                          {order.status === 'pending' ? t('admin.pending') : 
                           order.status === 'accepted' ? t('admin.accepted') : 
                           order.status === 'rejected' ? t('admin.rejected') : 
                           t('admin.pending')}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#ec4899', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        ${order.total.toFixed(2)}
                      </div>
                      {orderDisplayCurrency !== 'USD' && (
                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {formatPrice(order.total, orderExchangeRate, orderDisplayCurrency)}
                        </div>
                      )}
                      {order.totalProfit && (
                        <div style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {t('admin.profit')}: ${order.totalProfit.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', color: '#9ca3af' }}>
                    {order.items.length} {t('admin.items')} • {t('admin.discount')}: ${order.discount.toFixed(2)}
                    {order.tax && order.tax > 0 && ` • ${t('admin.tax')}: $${order.tax.toFixed(2)}`}
                  </div>
                </div>
              );
            })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>{t('admin.orderDetails')}</h2>
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

            <div style={{ color: '#9ca3af', marginBottom: '1.5rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <p><strong>{t('admin.date')}:</strong> {formatDate(selectedOrder.timestamp)}</p>
              {selectedOrder.customerName && (
                <p><strong>{t('admin.customer')}:</strong> {selectedOrder.customerName}</p>
              )}
            </div>

            <h3 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '1rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>{t('admin.items')}:</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              {selectedOrder.items.map((item, index) => {
                const orderExchangeRate = selectedOrder.exchangeRate || exchangeRate;
                const orderDisplayCurrency = selectedOrder.displayCurrency || displayCurrency;
                return (
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
                  <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <p style={{ color: '#ffffff' }}>{item.title}</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      {item.quantity}x ${item.price.toFixed(2)}
                      {item.buyPrice && item.buyPrice > 0 && (
                        <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>
                          ({t('admin.profit')}: ${((item.price - item.buyPrice) * item.quantity).toFixed(2)})
                        </span>
                      )}
                    </p>
                    {orderDisplayCurrency !== 'USD' && (
                      <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {formatPrice(item.price, orderExchangeRate, orderDisplayCurrency)} × {item.quantity} = {formatPrice(item.subtotal, orderExchangeRate, orderDisplayCurrency)}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <p style={{ color: '#ec4899', fontWeight: 'bold' }}>${item.subtotal.toFixed(2)}</p>
                    {orderDisplayCurrency !== 'USD' && (
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        {formatPrice(item.subtotal, orderExchangeRate, orderDisplayCurrency)}
                      </p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {(() => {
                const orderExchangeRate = selectedOrder.exchangeRate || exchangeRate;
                const orderDisplayCurrency = selectedOrder.displayCurrency || displayCurrency;
                return (
                  <>
                    {selectedOrder.totalProfit && selectedOrder.totalProfit > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #374151' }}>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>{t('admin.totalProfit')}:</span>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                          ${selectedOrder.totalProfit.toFixed(2)}
                          {orderDisplayCurrency !== 'USD' && (
                            <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#9ca3af' }}>
                              ({formatPrice(selectedOrder.totalProfit, orderExchangeRate, orderDisplayCurrency)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#d1d5db' }}>{t('admin.subtotal')}:</span>
                      <span style={{ color: '#ffffff' }}>
                        ${selectedOrder.subtotal.toFixed(2)}
                        {orderDisplayCurrency !== 'USD' && (
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#9ca3af' }}>
                            ({formatPrice(selectedOrder.subtotal, orderExchangeRate, orderDisplayCurrency)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#d1d5db' }}>{t('admin.discount')}:</span>
                      <span style={{ color: '#10b981' }}>
                        -${selectedOrder.discount.toFixed(2)}
                        {orderDisplayCurrency !== 'USD' && (
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#9ca3af' }}>
                            ({formatPrice(selectedOrder.discount, orderExchangeRate, orderDisplayCurrency)})
                          </span>
                        )}
                      </span>
                    </div>
                    {selectedOrder.tax && selectedOrder.tax > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#d1d5db' }}>{t('admin.tax')}:</span>
                        <span style={{ color: '#ffffff' }}>
                          ${selectedOrder.tax.toFixed(2)}
                          {orderDisplayCurrency !== 'USD' && (
                            <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#9ca3af' }}>
                              ({formatPrice(selectedOrder.tax, orderExchangeRate, orderDisplayCurrency)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#d1d5db' }}>{t('admin.total')}:</span>
                      <span style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        ${selectedOrder.total.toFixed(2)}
                        {orderDisplayCurrency !== 'USD' && (
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#9ca3af' }}>
                            ({formatPrice(selectedOrder.total, orderExchangeRate, orderDisplayCurrency)})
                          </span>
                        )}
                      </span>
                    </div>
                  </>
                );
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>{t('admin.payment')}:</span>
                <span style={{ color: '#ffffff' }}>${selectedOrder.paymentAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#d1d5db' }}>{t('admin.change')}:</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>${selectedOrder.change.toFixed(2)}</span>
              </div>
              {selectedOrder.status === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #374151' }}>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'accepted')}
                    disabled={updatingStatus === selectedOrder._id}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      opacity: updatingStatus === selectedOrder._id ? 0.5 : 1,
                    }}
                  >
                    {updatingStatus === selectedOrder._id ? '...' : t('admin.acceptOrder')}
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'rejected')}
                    disabled={updatingStatus === selectedOrder._id}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      opacity: updatingStatus === selectedOrder._id ? 0.5 : 1,
                    }}
                  >
                    {updatingStatus === selectedOrder._id ? '...' : t('admin.rejectOrder')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal with Charts */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem',
            overflow: 'auto',
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #374151',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={32} />
                Sales Reports & Analytics
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
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

            {/* Report Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Orders</div>
                <div style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold' }}>{filteredOrders.length}</div>
              </div>
              <div style={{ backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Revenue</div>
                <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>${getTotalRevenue().toFixed(2)}</div>
              </div>
              <div style={{ backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Profit</div>
                <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold' }}>${getTotalProfit().toFixed(2)}</div>
              </div>
              <div style={{ backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Items Sold</div>
                <div style={{ color: '#ec4899', fontSize: '1.5rem', fontWeight: 'bold' }}>{getTotalItems()}</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              {/* Daily Revenue Chart */}
              {getDailyRevenueData().length > 0 && (
                <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '1rem' }}>Daily Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getDailyRevenueData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151', color: '#ffffff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Monthly Revenue Chart */}
              {getMonthlyRevenueData().length > 0 && (
                <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '1rem' }}>Monthly Revenue</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getMonthlyRevenueData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151', color: '#ffffff' }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                      <Bar dataKey="profit" fill="#10b981" name="Profit ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Order Status Distribution */}
              {getStatusDistribution().length > 0 && (
                <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '1rem' }}>Order Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getStatusDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getStatusDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151', color: '#ffffff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Order Source Distribution */}
              {getSourceDistribution().length > 0 && (
                <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '1rem' }}>Order Source Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getSourceDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getSourceDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151', color: '#ffffff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={exportReport}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Download size={18} />
                Export Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#374151',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

