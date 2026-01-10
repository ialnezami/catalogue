'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import {
  Scan, Search, Plus, Minus, Trash2, Percent, Printer,
  Camera, DollarSign, ShoppingBag, Zap, CheckCircle, LogOut, Share2, Home, Package, X
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCartStore } from '@/stores/cartStore';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import { getCurrencySettings, formatPrice } from '@/lib/currency';
import toast from 'react-hot-toast';

export default function POSNew() {
  const [allProducts, setAllProducts] = useState<any[]>([]);
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

  const loadCurrencySettings = async () => {
    try {
      // Get platform from URL parameter
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const platform = urlParams?.get('platform') || undefined;
      
      const settings = await getCurrencySettings(platform);
      setExchangeRate(settings.exchangeRate);
      setDisplayCurrency(settings.displayCurrency);
    } catch (error) {
      console.error('Error loading currency settings:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (typeof window === 'undefined') return;
      
      // Get platform and initialize cart
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform') || 'default';
      
      // Store platform in sessionStorage for cart store access
      sessionStorage.setItem('currentPlatform', platform);
      
      // Initialize cart for this platform
      const { setPlatform } = useCartStore.getState();
      setPlatform(platform);
      
      await loadProducts();
      await loadCurrencySettings();
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };
    initialize();
  }, []);

  // Update cart when platform changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform') || 'default';
    sessionStorage.setItem('currentPlatform', platform);
    
    const { setPlatform, platform: currentPlatform } = useCartStore.getState();
    
    if (currentPlatform !== platform) {
      setPlatform(platform);
    }
  }, [typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('platform') : null]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allProducts.filter((product) =>
        (product.title || product.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProducts(filtered);
    } else {
      setProducts(allProducts);
    }
  }, [searchTerm, allProducts]);

  const loadProducts = async () => {
    try {
      // Get platform from URL or use 'default'
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform') || 'default';
      
      const response = await fetch(`/api/products?platform=${platform}`);
      const data = await response.json();
      setAllProducts(data);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    if (barcode.length < 3) return; // Wait for more characters
    
    const product = allProducts.find((p) => 
      (p.barcode || '').toLowerCase() === barcode.toLowerCase()
    );
    if (product) {
      addItem(product);
      toast.success(`Added ${product.title || product.name}`, { duration: 1500 });
      
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

    // Get platform from URL parameter
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const platform = urlParams?.get('platform') || 'default';

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
      source: 'pos', // Mark as POS order (auto-accepted)
      exchangeRate: exchangeRate,
      displayCurrency: displayCurrency,
      currency: 'USD',
      timestamp: new Date(),
    };

    try {
      const response = await fetch(`/api/orders?platform=${platform}`, {
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 p-4 md:p-6 lg:p-8">
        {/* Simplified Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Point of Sale</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} />
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
              <span className="flex items-center gap-2">
                <DollarSign size={18} />
                {formatPrice(getTotal(), exchangeRate, displayCurrency)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setScannerActive(!scannerActive)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                scannerActive 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Zap size={18} />
              {scannerActive ? 'Scanner ON' : 'Scanner OFF'}
            </button>
            <a
              href="/admin/products"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Home size={18} />
              Products
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Products Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Unified Search Bar */}
            <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search 
                    size={20} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                  />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    onChange={(e) => handleBarcodeScan(e.target.value)}
                    placeholder="Scan barcode or type to search..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors text-base"
                  />
                </div>
                <button
                  onClick={startScanner}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
                >
                  <Camera size={20} />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
              
              {/* Search Filter */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by name or category..."
                className="w-full mt-3 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
              />
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
                <Package size={64} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg font-medium">No products found</p>
                <p className="text-gray-500 text-sm mt-2">
                  {searchTerm ? 'Try adjusting your search' : 'Loading products...'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {products.map((product) => (
                  <button
                    key={product._id || product.id}
                    onClick={() => {
                      addItem(product);
                      toast.success(`Added ${product.title || product.name}`, { duration: 1500 });
                    }}
                    className="group bg-gray-900 border-2 border-gray-800 rounded-xl p-4 text-left transition-all hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20 hover:-translate-y-1 active:scale-95"
                  >
                    {product.image && (
                      <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-800">
                        <img 
                          src={product.image} 
                          alt={product.title || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-pink-400 transition-colors">
                      {product.title || product.name}
                    </h3>
                    <p className="text-gray-400 text-xs mb-2">{product.category}</p>
                    <p className="text-pink-500 font-bold text-lg">
                      {formatPrice(product.price, exchangeRate, displayCurrency)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Section - Sticky on large screens */}
          <div 
            ref={cartSectionRef}
            className="lg:sticky lg:top-6 lg:self-start order-1 lg:order-2"
          >
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag size={24} />
                  Cart
                </h2>
                {items.length > 0 && (
                  <span className="bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={64} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-400 text-lg font-medium">Cart is empty</p>
                  <p className="text-gray-500 text-sm mt-2">Add products to get started</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-6">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm mb-1 truncate">{item.name}</h3>
                            <p className="text-gray-400 text-xs">{formatPrice(item.price, exchangeRate, displayCurrency)} each</p>
                          </div>
                          <button
                            onClick={() => {
                              removeItem(item._id);
                              toast.success('Item removed', { duration: 1000 });
                            }}
                            className="text-red-400 hover:text-red-300 p-1 transition-colors flex-shrink-0"
                            title="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="w-8 h-8 rounded-md bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors active:scale-95"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="text-white font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="w-8 h-8 rounded-md bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors active:scale-95"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="text-pink-500 font-bold text-base">
                            {formatPrice(item.subtotal, exchangeRate, displayCurrency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-gray-700 pt-4 mb-6 space-y-3">
                    <div className="flex justify-between text-gray-300 text-sm">
                      <span>Subtotal</span>
                      <span className="text-white font-medium">
                        {formatPrice(getSubtotal(), exchangeRate, displayCurrency)}
                        {displayCurrency !== 'USD' && (
                          <span className="text-gray-500 text-xs ml-2">
                            (${getSubtotal().toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-400 text-sm">
                        <span>Discount</span>
                        <span className="font-medium">
                          -{formatPrice(discount, exchangeRate, displayCurrency)}
                          {displayCurrency !== 'USD' && (
                            <span className="text-gray-500 text-xs ml-2">
                              (-${discount.toFixed(2)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-gray-300 text-sm">
                      <span>Tax</span>
                      <input
                        type="number"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-right text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t-2 border-blue-500">
                      <span className="text-lg font-bold text-white">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-pink-500 block">
                          {formatPrice(getTotal(), exchangeRate, displayCurrency)}
                        </span>
                        {displayCurrency !== 'USD' && (
                          <span className="text-gray-400 text-xs">
                            ${getTotal().toFixed(2)} USD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowDiscountModal(true)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      <Percent size={18} />
                      Discount
                    </button>
                    
                    <button
                      onClick={handleCheckout}
                      className="w-full py-4 px-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-98"
                    >
                      <CheckCircle size={22} />
                      Complete Sale
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={shareOnWhatsApp}
                        className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all text-sm active:scale-98"
                      >
                        <Share2 size={16} />
                        Share
                      </button>
                      <button
                        onClick={clearCart}
                        className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all text-sm active:scale-98"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Discount Modal */}
        {showDiscountModal && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDiscountModal(false)}
          >
            <div 
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Percent size={24} />
                  Apply Discount
                </h2>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Discount Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDiscountType('fixed')}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all ${
                        discountType === 'fixed'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Fixed Amount
                    </button>
                    <button
                      onClick={() => setDiscountType('percent')}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all ${
                        discountType === 'percent'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Percentage
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {discountType === 'percent' ? 'Discount (%)' : 'Discount Amount'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder={discountType === 'percent' ? 'Enter percentage' : 'Enter amount'}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    step={discountType === 'percent' ? '1' : '0.01'}
                    min="0"
                    max={discountType === 'percent' ? '100' : undefined}
                  />
                </div>
                
                {discountType === 'percent' && discountValue > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-blue-400 text-sm">
                      Discount: {formatPrice((getSubtotal() * discountValue) / 100, exchangeRate, displayCurrency)}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDiscountModal(false);
                      setDiscountValue(0);
                    }}
                    className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyDiscount}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Modal */}
        {scannerVisible && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Camera size={24} />
                  Barcode Scanner
                </h2>
                <button
                  onClick={stopScanner}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
              <div id="barcode-scanner" className="mb-4 rounded-lg overflow-hidden bg-gray-800" />
              <p className="text-gray-400 text-center text-sm">
                Position barcode within the camera view
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

