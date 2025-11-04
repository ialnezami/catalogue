import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { ShoppingBag, Trash2, Share2, Plus, Minus, Printer } from 'lucide-react';
import { getCurrencySettings, formatPrice } from '@/lib/currency';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clipboard' | 'whatsapp' | 'print' | null>(null);
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [displayCurrency, setDisplayCurrency] = useState('SP');
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    const loadCurrencySettings = async () => {
      // Get platform from URL parameter or cookie
      const platform = (router.query.platform as string) || 
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('platform') : null);
      
      const settings = await getCurrencySettings(platform || undefined);
      setExchangeRate(settings.exchangeRate);
      setDisplayCurrency(settings.displayCurrency);
      setCurrency(settings.currency);
    };
    
    if (router.isReady) {
      loadCurrencySettings();
    }
  }, [router.isReady, router.query.platform]);

  const exportToJson = (name: string) => {
    const cartData = {
      customerName: name,
      items: cartItems.map(item => ({
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      })),
      total: getTotalPrice(),
    };
    return JSON.stringify(cartData, null, 2);
  };

  const createOrder = async () => {
    if (!customerName) return;
    
    try {
      // Get platform from URL parameter
      const platform = router.query.platform as string || 
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('platform') : null);
      
      if (!platform) {
        console.error('Platform is required to create order');
        return;
      }

      const orderData = {
        customerName,
        items: cartItems.map(item => ({
          productId: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
        })),
        subtotal: getTotalPrice(),
        discount: 0,
        tax: 0,
        total: getTotalPrice(),
        source: 'cart', // Mark as cart order (needs admin approval)
        exchangeRate,
        displayCurrency,
        currency,
      };

      const response = await fetch(`/api/orders?platform=${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        console.error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const executeAction = async () => {
    if (!customerName) return;
    
    // Create order in database
    await createOrder();
    
    switch (pendingAction) {
      case 'clipboard':
        const jsonData = exportToJson(customerName);
        navigator.clipboard.writeText(jsonData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case 'whatsapp':
        const whatsappJsonData = exportToJson(customerName);
        const totalFormatted = formatPrice(getTotalPrice(), exchangeRate, displayCurrency);
        const whatsappMessage = encodeURIComponent(
          `🛍️ Shopping Cart - ${customerName}\n\n${whatsappJsonData}\n\nTotal: ${totalFormatted}`
        );
        window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
        break;
      case 'print':
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const total = getTotalPrice();
        const billHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bill - ${customerName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #ec4899;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #ec4899;
              margin: 0;
            }
            .customer-info {
              margin-bottom: 20px;
            }
            .items {
              margin-bottom: 20px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .item-title {
              font-weight: bold;
            }
            .item-details {
              font-size: 0.9em;
              color: #666;
            }
            .totals {
              border-top: 2px solid #ec4899;
              padding-top: 10px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .grand-total {
              font-size: 1.2em;
              font-weight: bold;
              color: #ec4899;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>سلة المشتريات</h1>
          </div>
          
          <div class="customer-info">
            <strong>العميل:</strong> ${customerName}<br>
            <strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}
          </div>
          
          <div class="items">
            <h3>المنتجات:</h3>
            ${cartItems.map(item => `
              <div class="item">
                <div>
                  <div class="item-title">${item.product.title}</div>
                  <div class="item-details">
                    ${formatPrice(item.product.price, exchangeRate, displayCurrency)} × ${item.quantity}
                  </div>
                </div>
                <div>
                  ${formatPrice(item.product.price * item.quantity, exchangeRate, displayCurrency)}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${formatPrice(total, exchangeRate, displayCurrency)}</span>
            </div>
            <div class="total-row">
              <span>الضريبة:</span>
              <span>${formatPrice(0, exchangeRate, displayCurrency)}</span>
            </div>
            <div class="total-row grand-total">
              <span>الإجمالي:</span>
              <span>${formatPrice(total, exchangeRate, displayCurrency)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
            <p>شكراً لكم لاختياركم منتجاتنا!</p>
            <p>Thank you for choosing our products!</p>
          </div>
        </body>
      </html>
    `;

        printWindow.document.write(billHtml);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
          // Clear cart after printing
          setTimeout(() => {
            clearCart();
            printWindow.close();
          }, 1000);
        }, 500);
        break;
    }
  };

  const copyToClipboard = () => {
    if (!customerName) {
      setPendingAction('clipboard');
      setShowNameModal(true);
      return;
    }
    setPendingAction('clipboard');
    executeAction();
  };

  const shareOnWhatsApp = () => {
    if (!customerName) {
      setPendingAction('whatsapp');
      setShowNameModal(true);
      return;
    }
    setPendingAction('whatsapp');
    executeAction();
  };

  const printBill = () => {
    if (!customerName) {
      setPendingAction('print');
      setShowNameModal(true);
      return;
    }
    
    setPendingAction('print');
    executeAction();
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
          }}
        >
          <ShoppingBag size={80} color="#9ca3af" style={{ margin: '0 auto 2rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffffff' }}>سلة المشتريات فارغة</h2>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            ابدأي بإضافة المنتجات الجميلة إلى السلة!
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#ec4899', margin: 0 }}>سلة المشتريات</h1>
        <button
          onClick={clearCart}
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
            transition: 'background-color 0.3s',
            fontSize: '1rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
        >
          <Trash2 size={20} />
          مسح السلة
        </button>
      </div>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          gap: '2rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item) => (
            <div
              key={item.product.id}
              style={{
                backgroundColor: '#1a1a1a',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                display: 'flex',
                gap: '1.5rem',
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
              >
                <img
                  src={item.product.image.startsWith('http') ? item.product.image : `/images/${item.product.image}`}
                  alt={item.product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#ffffff' }}>
                  {item.product.title}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {item.product.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      style={{
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #374151',
                        color: '#ffffff',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Minus size={18} />
                    </button>
                    <span style={{ fontSize: '1.125rem', minWidth: '40px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      style={{
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #374151',
                        color: '#ffffff',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ec4899' }}>
                    {formatPrice(item.product.price * item.quantity, exchangeRate, displayCurrency)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.product.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #374151',
                  color: '#ef4444',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #374151',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#ffffff' }}>ملخص الطلب</h2>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#d1d5db' }}>المجموع الفرعي</span>
                <span style={{ color: '#ffffff' }}>{formatPrice(getTotalPrice(), exchangeRate, displayCurrency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>الضريبة</span>
                <span style={{ color: '#ffffff' }}>{formatPrice(0, exchangeRate, displayCurrency)}</span>
              </div>
              <div style={{ borderTop: '1px solid #374151', margin: '1rem 0', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>الإجمالي</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
                    {formatPrice(getTotalPrice(), exchangeRate, displayCurrency)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={copyToClipboard}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: copied ? '#10b981' : '#2a2a2a',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                }}
              >
                <Share2 size={18} />
                {copied ? 'تم النسخ!' : 'نسخ JSON'}
              </button>
              <button
                onClick={shareOnWhatsApp}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#ec4899',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                <Share2 size={18} />
                مشاركة على واتساب
              </button>
              <button
                onClick={printBill}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                <Printer size={18} />
                طباعة الفاتورة
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNameModal && (
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
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #374151',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '1rem' }}>Enter Customer Name</h3>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              Please enter the customer name to share the cart.
            </p>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '1rem',
                marginBottom: '1.5rem',
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setPendingAction(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customerName.trim()) {
                    setShowNameModal(false);
                    executeAction();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#ec4899',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

