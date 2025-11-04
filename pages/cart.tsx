import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingBag, Trash2, Share2, Plus, Minus, Printer, ChevronDown, CheckCircle } from 'lucide-react';
import { getCurrencySettings, formatPrice } from '@/lib/currency';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clipboard' | 'whatsapp' | null>(null);
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [displayCurrency, setDisplayCurrency] = useState('SP');
  const [currency, setCurrency] = useState('USD');
  const shareDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setShowShareDropdown(false);
      }
    };

    if (showShareDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareDropdown]);

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
        setShowShareDropdown(false);
        break;
      case 'whatsapp':
        const whatsappJsonData = exportToJson(customerName);
        const totalFormatted = formatPrice(getTotalPrice(), exchangeRate, displayCurrency);
        const whatsappMessage = encodeURIComponent(
          `🛍️ Shopping Cart - ${customerName}\n\n${whatsappJsonData}\n\nTotal: ${totalFormatted}`
        );
        window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
        setShowShareDropdown(false);
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

  const handlePayOnDelivery = async () => {
    if (!customerName) {
      setShowNameModal(true);
      setPendingAction(null);
      return;
    }

    // Create order first
    await createOrder();
    
    // Show confirmation modal with printable bill
    setShowConfirmationModal(true);
  };

  const generateBillHtml = () => {
    const total = getTotalPrice();
    const isArabic = language === 'ar';
    
    return `
      <!DOCTYPE html>
      <html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${language}">
        <head>
          <meta charset="utf-8">
          <title>${t('cart.confirmationBill')} - ${customerName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              direction: ${isArabic ? 'rtl' : 'ltr'};
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
            <h1>${t('cart.confirmationBill')}</h1>
            <p style="color: #10b981; font-weight: bold; margin-top: 10px;">${t('cart.orderConfirmed')}</p>
          </div>
          
          <div class="customer-info">
            <strong>${t('cart.customer')}:</strong> ${customerName}<br>
            <strong>${t('cart.date')}:</strong> ${new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
          </div>
          
          <div class="items">
            <h3>${t('cart.products')}:</h3>
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
              <span>${t('cart.subtotal')}:</span>
              <span>${formatPrice(total, exchangeRate, displayCurrency)}</span>
            </div>
            <div class="total-row">
              <span>${t('cart.tax')}:</span>
              <span>${formatPrice(0, exchangeRate, displayCurrency)}</span>
            </div>
            <div class="total-row grand-total">
              <span>${t('cart.total')}:</span>
              <span>${formatPrice(total, exchangeRate, displayCurrency)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
            <p>${t('cart.thankYou')}</p>
            <p>${t('cart.thankYouEn')}</p>
          </div>
        </body>
      </html>
    `;
  };

  const printBill = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const billHtml = generateBillHtml();
    printWindow.document.write(billHtml);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      // Clear cart after printing
      setTimeout(() => {
        clearCart();
        setShowConfirmationModal(false);
        setCustomerName('');
        printWindow.close();
      }, 1000);
    }, 500);
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
          }}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <ShoppingBag size={80} color="#9ca3af" style={{ margin: '0 auto 2rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffffff' }}>
            {t('cart.emptyCart')}
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            {t('cart.addProducts')}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <h1 style={{ fontSize: '2.5rem', color: '#ec4899', margin: 0 }}>
          {t('cart.shoppingCart')}
        </h1>
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
          {t('cart.clearCart')}
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
                    <span style={{ fontSize: '1.125rem', minWidth: '40px', textAlign: 'center', color: '#ffffff' }}>
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
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#ffffff' }}>
              {t('cart.orderSummary')}
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>{t('cart.subtotal')}</span>
                <span style={{ color: '#ffffff' }}>{formatPrice(getTotalPrice(), exchangeRate, displayCurrency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>{t('cart.tax')}</span>
                <span style={{ color: '#ffffff' }}>{formatPrice(0, exchangeRate, displayCurrency)}</span>
              </div>
              <div style={{ borderTop: '1px solid #374151', margin: '1rem 0', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>{t('cart.total')}</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
                    {formatPrice(getTotalPrice(), exchangeRate, displayCurrency)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
              {/* Share Dropdown */}
              <div ref={shareDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowShareDropdown(!showShareDropdown)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Share2 size={18} />
                    {t('cart.share')}
                  </div>
                  <ChevronDown size={18} style={{ transform: showShareDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                </button>
                
                {showShareDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: language === 'ar' ? 'auto' : 0,
                      right: language === 'ar' ? 0 : 'auto',
                      marginTop: '0.5rem',
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      minWidth: '200px',
                      zIndex: 1000,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                  >
                    <button
                      onClick={copyToClipboard}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: copied ? '#10b981' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        textAlign: language === 'ar' ? 'right' : 'left',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        if (!copied) e.currentTarget.style.backgroundColor = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        if (!copied) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Share2 size={16} />
                      {copied ? t('cart.copied') : t('cart.copyJson')}
                    </button>
                    <button
                      onClick={shareOnWhatsApp}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        textAlign: language === 'ar' ? 'right' : 'left',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Share2 size={16} />
                      {t('cart.shareWhatsApp')}
                    </button>
                  </div>
                )}
              </div>

              {/* Pay on Delivery Button */}
              <button
                onClick={handlePayOnDelivery}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                <CheckCircle size={18} />
                {t('cart.payOnDelivery')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Name Input Modal */}
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
          onClick={() => {
            setShowNameModal(false);
            setPendingAction(null);
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
            onClick={(e) => e.stopPropagation()}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <h3 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '1rem' }}>
              {t('cart.customerName')}
            </h3>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              {t('cart.enterCustomerName')}
            </p>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t('cart.enterName')}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && customerName.trim()) {
                  setShowNameModal(false);
                  if (pendingAction) {
                    executeAction();
                  } else {
                    handlePayOnDelivery();
                  }
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '2px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '1rem',
                marginBottom: '1.5rem',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ec4899';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#374151';
              }}
            />
            <div style={{ display: 'flex', gap: '1rem', flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
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
                {t('cart.cancel')}
              </button>
              <button
                onClick={() => {
                  if (customerName.trim()) {
                    setShowNameModal(false);
                    if (pendingAction) {
                      executeAction();
                    } else {
                      handlePayOnDelivery();
                    }
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
                {t('cart.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Bill Modal */}
      {showConfirmationModal && (
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
          }}
          onClick={() => setShowConfirmationModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #374151',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
                {t('cart.orderConfirmed')}
              </h2>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '1rem' }}>
                {t('cart.confirmationBill')}
              </h3>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#d1d5db' }}>{t('cart.customer')}:</strong>
                <span style={{ color: '#ffffff', marginLeft: '0.5rem' }}>{customerName}</span>
              </div>
              <div>
                <strong style={{ color: '#d1d5db' }}>{t('cart.date')}:</strong>
                <span style={{ color: '#ffffff', marginLeft: '0.5rem' }}>
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#ffffff', marginBottom: '0.75rem' }}>{t('cart.products')}:</h4>
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid #374151',
                  }}
                >
                  <div>
                    <div style={{ color: '#ffffff', fontWeight: 'bold' }}>{item.product.title}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      {formatPrice(item.product.price, exchangeRate, displayCurrency)} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ color: '#ec4899', fontWeight: 'bold' }}>
                    {formatPrice(item.product.price * item.quantity, exchangeRate, displayCurrency)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #ec4899', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>{t('cart.subtotal')}:</span>
                <span style={{ color: '#ffffff' }}>
                  {formatPrice(getTotalPrice(), exchangeRate, displayCurrency)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#d1d5db' }}>{t('cart.tax')}:</span>
                <span style={{ color: '#ffffff' }}>
                  {formatPrice(0, exchangeRate, displayCurrency)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>{t('cart.total')}:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
                  {formatPrice(getTotalPrice(), exchangeRate, displayCurrency)}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#9ca3af' }}>
              <p>{t('cart.thankYou')}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  clearCart();
                  setCustomerName('');
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
                {t('cart.cancel')}
              </button>
              <button
                onClick={printBill}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Printer size={18} />
                {t('cart.printBill')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
