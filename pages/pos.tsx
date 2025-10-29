'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import {
  Scan, Search, Plus, Minus, Trash2, Percent, Printer,
  Camera, DollarSign, ShoppingBag, Zap, CheckCircle, LogOut, Share2
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCartStore } from '@/stores/cartStore';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import { getCurrencySettings, formatPrice } from '@/lib/currency';
import toast from 'react-hot-toast';

export default function POSNew() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [pendingPrint, setPendingPrint] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [displayCurrency, setDisplayCurrency] = useState('SP');
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const {
    items,
    discount,
    tax,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    setDiscount,
    setTax,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const cartSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
    loadCurrencySettings();
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const loadCurrencySettings = async () => {
    const settings = await getCurrencySettings();
    setExchangeRate(settings.exchangeRate);
    setDisplayCurrency(settings.displayCurrency);
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter((product) =>
        (product.title || product.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProducts(filtered);
    }
  }, [searchTerm, products]);

  const [showNoPlatform, setShowNoPlatform] = useState(false);

  useEffect(() => {
    // Check for platform on mount
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform');
    
    if (!platform) {
      setShowNoPlatform(true);
    } else {
      loadProducts();
      loadCurrencySettings();
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  }, []);

  const loadProducts = async () => {
    try {
      // Get platform from URL - REQUIRED
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform');
      
      if (!platform) {
        setShowNoPlatform(true);
        return;
      }
      
      const response = await fetch(`/api/products?platform=${platform}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find((p) => 
      (p.barcode || '').toLowerCase() === barcode.toLowerCase()
    );
    if (product) {
      addItem(product);
      
      // Scroll to cart section on mobile after adding item
      if (cartSectionRef.current && window.innerWidth <= 768) {
        setTimeout(() => {
          cartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = '';
        barcodeInputRef.current.focus();
      }
    }
  };

  const startScanner = async () => {
    setScannerVisible(true);
    
    try {
      // Request camera permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      });
      // Stop the stream as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Now initialize the scanner
      setTimeout(() => {
        const html5QrcodeScanner = new Html5QrcodeScanner(
          'barcode-scanner',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 }, 
            aspectRatio: 1.0,
            // This will try to use back camera by default
            videoConstraints: {
              facingMode: { exact: 'environment' } // Back camera for mobile
            }
          },
          false // verbose
        );
        html5QrcodeScanner.render(onScanSuccess, onScanError);
        scannerRef.current = html5QrcodeScanner;
      }, 100);
    } catch (error: any) {
      console.error('Camera permission error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Please allow camera access to use the barcode scanner. Go to browser settings to enable camera permissions.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Error accessing camera: ' + error.message);
      }
      setScannerVisible(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerVisible(false);
  };

  const onScanSuccess = (decodedText: string, decodedResult: any) => {
    handleBarcodeScan(decodedText);
    stopScanner();
  };

  const onScanError = (error: any) => {
    // Silently ignore scan errors (the scanner will keep trying)
    // Only show errors if it's a permission issue
    if (error && typeof error === 'string' && (error.includes('Permission') || error.includes('NotAllowed'))) {
      // Permission error already handled in startScanner
      console.log('Scan error (may be ongoing):', error);
    }
    // Don't alert on scan errors as they happen frequently during scanning
  };

  const applyDiscount = () => {
    if (discountType === 'percent') {
      const subtotal = getSubtotal();
      setDiscount((subtotal * discountValue) / 100);
    } else {
      setDiscount(discountValue);
    }
    setShowDiscountModal(false);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    const orderTotal = getTotal();
    const orderData = {
      items: items.map(item => ({
        productId: item._id,
        title: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount || 0,
        subtotal: item.subtotal,
      })),
      subtotal: getSubtotal(),
      discount: discount || 0,
      tax: tax || 0,
      total: orderTotal,
      paymentAmount: orderTotal,
      change: 0,
      timestamp: new Date(),
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        console.log('Order saved successfully:', orderData);
        // Generate and print receipt
        generateReceipt();
        toast.success('Order completed and saved successfully!');
        clearCart();
        setDiscount(0);
        setTax(0);
      } else {
        const errorData = await response.json();
        console.error('Error saving order:', errorData);
        toast.error('Error saving order!');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Error saving order!');
    }
  };

  const generateReceipt = () => {
    const total = getTotal();
    const subtotal = getSubtotal();
    const billHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - POS</title>
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
            <h1>رسالة الفاتورة</h1>
          </div>
          
          <div class="customer-info">
            <strong>العملية:</strong> بيع POS<br>
            <strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}
          </div>
          
          <div class="items">
            <h3>المنتجات:</h3>
            ${items.map(item => `
              <div class="item">
                <div>
                  <div class="item-title">${item.name}</div>
                  <div class="item-details">
                    ${formatPrice(item.price, exchangeRate, displayCurrency)} × ${item.quantity}
                  </div>
                </div>
                <div>
                  ${formatPrice(item.subtotal, exchangeRate, displayCurrency)}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${formatPrice(subtotal, exchangeRate, displayCurrency)}</span>
            </div>
            ${discount > 0 ? `
            <div class="total-row">
              <span>الخصم:</span>
              <span>-${formatPrice(discount, exchangeRate, displayCurrency)}</span>
            </div>
            ` : ''}
            ${tax > 0 ? `
            <div class="total-row">
              <span>الضريبة:</span>
              <span>${formatPrice(tax, exchangeRate, displayCurrency)}</span>
            </div>
            ` : ''}
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

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(billHtml);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const shareOnWhatsApp = () => {
    if (items.length === 0) return;

    const cartData = {
      customerName: 'POS Sale',
      items: items.map(item => ({
        title: item.name,
        priceUSD: item.price,
        priceSP: Math.round(item.price * exchangeRate),
        quantity: item.quantity,
        subtotalUSD: item.subtotal,
        subtotalSP: Math.round(item.subtotal * exchangeRate),
      })),
      subtotalUSD: getSubtotal(),
      subtotalSP: Math.round(getSubtotal() * exchangeRate),
      totalUSD: getTotal(),
      totalSP: Math.round(getTotal() * exchangeRate),
      discount: discount,
      tax: tax,
      exchangeRate: exchangeRate,
      date: new Date().toISOString(),
    };

    // Create a formatted message
    const message = `🧾 Bill - Receipt

Items:
${items.map(item => `  • ${item.name} x${item.quantity} = ${Math.round(item.subtotal * exchangeRate).toLocaleString('ar-EG')} ل.س`).join('\n')}

Subtotal: ${Math.round(getSubtotal() * exchangeRate).toLocaleString('ar-EG')} ل.س
${discount > 0 ? `Discount: ${discount.toFixed(2)}\n` : ''}
Total: ${Math.round(getTotal() * exchangeRate).toLocaleString('ar-EG')} ل.س

Exchange Rate: 1 USD = ${exchangeRate} SP
Date: ${new Date().toLocaleString('ar-EG')}

📋 Details: ${JSON.stringify(cartData, null, 2)}`;

    const whatsappMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
  };

  // Show blank page if no platform
  if (showNoPlatform) {
    return (
      <Layout>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: '#0a0a0a'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '1rem' }}>
              Platform Required
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
              POS requires a platform parameter
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Use: /pos?platform=roze
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '2rem', backgroundColor: '#0a0a0a', minHeight: '100vh' }} className="pos-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          color: '#ffffff'
        }} className="pos-header">
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
               POS System
             </h1>
             <p style={{ fontSize: '1rem', opacity: 0.9 }}>
               {items.length} items in cart • Total: {Math.round(getTotal() * exchangeRate).toLocaleString('ar-EG')} ل.س
             </p>
           </div>
           <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }} className="pos-header-actions">
             <button
               onClick={() => setScannerActive(!scannerActive)}
               style={{
                 padding: '1rem 1.5rem',
                 background: scannerActive ? '#10b981' : '#6b7280',
                 border: 'none',
                 borderRadius: '12px',
                 color: '#ffffff',
                 fontWeight: 'bold',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 transition: 'all 0.3s',
               }}
             >
               <Zap size={24} />
               {scannerActive ? 'Scanner ON' : 'Scanner OFF'}
             </button>
             <a
               href="/admin/products"
               style={{
                 padding: '1rem 1.5rem',
                 background: 'rgba(255, 255, 255, 0.2)',
                 border: '1px solid rgba(255, 255, 255, 0.3)',
                 borderRadius: '12px',
                 color: '#ffffff',
                 fontWeight: 'bold',
                 cursor: 'pointer',
                 textDecoration: 'none',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
               }}
             >
               Admin Panel
             </a>
           </div>
         </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }} className="pos-main-grid">
          {/* Products Section */}
          <div className="pos-products-section">
            <div style={{ 
              backgroundColor: '#1a1a1a',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              border: '1px solid #333'
            }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    onChange={(e) => handleBarcodeScan(e.target.value)}
                    placeholder="Scan barcode or search products..."
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      backgroundColor: '#2a2a2a',
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '1rem',
                    }}
                  />
                </div>
                <button
                  onClick={startScanner}
                  style={{
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                >
                  <Camera size={24} />
                  Camera
                </button>
              </div>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or category..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  color: '#ffffff',
                }}
              />
            </div>

             {/* Products Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }} className="products-grid">
               {products.map((product) => (
                 <button
                   key={product._id || product.id}
                   onClick={() => addItem(product)}
                   className="product-card"
                   style={{
                     padding: '1.5rem',
                     background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                     border: '2px solid #333',
                     borderRadius: '16px',
                     cursor: 'pointer',
                     transition: 'all 0.3s',
                     textAlign: 'left',
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = '#ec4899';
                     e.currentTarget.style.transform = 'translateY(-4px)';
                     e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 72, 153, 0.3)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = '#333';
                     e.currentTarget.style.transform = 'translateY(0)';
                     e.currentTarget.style.boxShadow = 'none';
                   }}
                 >
                   <h3 style={{ color: '#ffffff', marginBottom: '0.5rem', fontSize: '1rem' }}>
                     {product.title || product.name}
                   </h3>
                   <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                     {product.category}
                   </p>
                   <p style={{ color: '#ec4899', fontSize: '1.25rem', fontWeight: 'bold' }}>
                     ${product.price}
                   </p>
                 </button>
              ))}
            </div>
          </div>

           {/* Cart Section */}
           <div 
             ref={cartSectionRef}
             style={{ 
               position: 'sticky', 
               top: '120px',
               alignSelf: 'start'
             }} 
             className="pos-cart-section"
           >
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #333',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
               <h2 
                 id="cart-header"
                 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
               >
                 <ShoppingBag size={24} />
                 Cart ({items.length})
               </h2>

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                  <ShoppingBag size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((item) => (
                      <div
                        key={item._id}
                        style={{
                          backgroundColor: '#2a2a2a',
                          padding: '1rem',
                          borderRadius: '12px',
                          border: '1px solid #333'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <h3 style={{ color: '#ffffff', fontSize: '0.875rem' }}>{item.name}</h3>
                          <button
                            onClick={() => removeItem(item._id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0.25rem'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#1a1a1a',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Minus size={16} />
                            </button>
                            <span style={{ color: '#ffffff', minWidth: '32px', textAlign: 'center' }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#1a1a1a',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '1rem' }}>
                            ${item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ color: '#9ca3af' }}>Subtotal:</span>
                              <span style={{ color: '#ffffff' }}>
                                {Math.round(getSubtotal() * exchangeRate).toLocaleString('ar-EG')} ل.س
                                <span style={{ fontSize: '0.75em', opacity: 0.7, marginLeft: '0.5rem' }}>
                                  (${getSubtotal().toFixed(2)})
                                </span>
                              </span>
                            </div>
                    {discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981' }}>
                        <span>Discount:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#9ca3af' }}>Tax:</span>
                      <input
                        type="number"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100px',
                          padding: '0.5rem',
                          background: '#2a2a2a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#ffffff',
                          textAlign: 'right'
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #3b82f6', paddingTop: '1rem', marginTop: '1rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>Total:</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
                        {Math.round(getTotal() * exchangeRate).toLocaleString('ar-EG')} ل.س
                        <span style={{ fontSize: '0.7em', fontWeight: 'normal', opacity: 0.8, marginLeft: '0.5rem' }}>
                          (${getTotal().toFixed(2)})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      onClick={() => setShowDiscountModal(true)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Percent size={20} />
                      Apply Discount
                    </button>
                    <button
                      onClick={handleCheckout}
                      style={{
                        width: '100%',
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Printer size={24} />
                      Complete Sale
                    </button>
                    <button
                      onClick={shareOnWhatsApp}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#25D366',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Share2 size={20} />
                      Share WhatsApp
                    </button>
                    <button
                      onClick={clearCart}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scanner Modal */}
        {scannerVisible && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: '#1a1a1a',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={24} />
                  Barcode Scanner
                </h2>
                <button
                  onClick={stopScanner}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
              <div id="barcode-scanner" style={{ marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden' }} />
              <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '0.875rem' }}>
                Position barcode within the camera view
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

