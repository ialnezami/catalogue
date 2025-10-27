import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { ShoppingCart, Scan, Search, Plus, Minus, Trash2, X, Camera } from 'lucide-react';
import { Product } from '@/types';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface POSItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

export default function POS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<POSItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [change, setChange] = useState(0);
  const [cartVisible, setCartVisible] = useState(true);
  const [scannerVisible, setScannerVisible] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    loadProducts();
    // Focus barcode input on mount
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter((product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      const formattedData = data.map((item: any) => ({
        ...item,
        id: item._id?.toString() || item.id,
      }));
      setProducts(formattedData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find((p) => p.barcode?.toLowerCase() === barcode.toLowerCase());
    if (product) {
      addToCart(product);
      setSearchTerm('');
    } else {
      alert('Product not found!');
    }
    // Keep focus on barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const addToCart = (product: Product, qty: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty, subtotal: (item.quantity + qty) * item.product.price }
            : item
        );
      }
      return [...prev, { product, quantity: qty, discount: 0, subtotal: qty * product.price }];
    });
    setSearchTerm('');
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity, subtotal: quantity * item.product.price }
          : item
      )
    );
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const subtotal = item.quantity * item.product.price;
          return { ...item, discount, subtotal: subtotal - discount };
        }
        return item;
      })
    );
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const getTotal = () => {
    return getSubtotal() - discount;
  };

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    if (paymentAmount < getTotal()) {
      alert('Payment amount is less than total!');
      return;
    }

    const order = {
      items: cartItems.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        discount: item.discount,
        subtotal: item.subtotal,
      })),
      subtotal: getSubtotal(),
      discount,
      total: getTotal(),
      paymentAmount,
      change: paymentAmount - getTotal(),
      timestamp: new Date(),
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (response.ok) {
        alert('Order saved successfully!');
        setCartItems([]);
        setDiscount(0);
        setPaymentAmount(0);
        setChange(0);
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order!');
    }
  };

  const handlePaymentInput = (amount: number) => {
    setPaymentAmount(amount);
    setChange(amount - getTotal());
  };

  const startScanner = () => {
    setScannerVisible(true);
    setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'barcode-scanner',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [1, 2] // 1 = QR_CODE, 2 = BARCODE
        },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(
        onScanSuccess,
        onScanError
      );

      scannerRef.current = html5QrcodeScanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerVisible(false);
  };

  const onScanSuccess = (decodedText: string) => {
    handleBarcodeScan(decodedText);
    stopScanner();
  };

  const onScanError = (errorMessage: string) => {
    // Ignore scan errors
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#ec4899' }}>POS System</h1>
        <button
          onClick={() => window.location.href = '/admin/products'}
          style={{
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Products Management
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cartVisible ? '1fr 400px' : '1fr', gap: '2rem' }}>
        <div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scan size={24} />
              Barcode Scanner
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.length > 8) {
                    handleBarcodeScan(e.target.value);
                  }
                }}
                placeholder="Type barcode or press camera to scan..."
                autoFocus
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#2a2a2a',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={startScanner}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                <Camera size={20} />
                Camera
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={24} />
              Search Products
            </h2>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, barcode, or category..."
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '1rem',
                marginBottom: '1rem',
              }}
            />

            {filteredProducts.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    style={{
                      backgroundColor: '#2a2a2a',
                      padding: '1rem',
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
                    <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '0.5rem' }}>{product.title}</h3>
                    {product.barcode && <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Barcode: {product.barcode}</p>}
                    <p style={{ color: '#ec4899', fontSize: '1.25rem', fontWeight: 'bold' }}>${product.price.toFixed(2)}</p>
                    {product.qty !== undefined && (
                      <p style={{ color: product.qty > 0 ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>
                        {product.qty > 0 ? `Stock: ${product.qty}` : 'Out of Stock'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {cartVisible && (
          <div style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={24} />
                  Cart ({cartItems.length})
                </h2>
                <button
                  onClick={() => setCartVisible(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.5rem',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {cartItems.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Cart is empty</p>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      style={{
                        backgroundColor: '#2a2a2a',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '0.875rem' }}>{item.product.title}</h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.25rem',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{
                            backgroundColor: '#374151',
                            border: 'none',
                            color: '#ffffff',
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{ color: '#ffffff', minWidth: '40px', textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{
                            backgroundColor: '#374151',
                            border: 'none',
                            color: '#ffffff',
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                        placeholder="Discount"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #374151',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                        }}
                      />
                      <p style={{ color: '#ec4899', fontSize: '1rem', fontWeight: 'bold' }}>
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#d1d5db' }}>Subtotal:</span>
                  <span style={{ color: '#ffffff' }}>${getSubtotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#d1d5db' }}>Discount:</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDiscount(val);
                      setChange(paymentAmount - (getTotal() - val));
                    }}
                    style={{
                      width: '100px',
                      padding: '0.25rem',
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #374151',
                      borderRadius: '4px',
                      color: '#ffffff',
                      textAlign: 'right',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #374151', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>Total:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Payment Amount:</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => handlePaymentInput(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                  }}
                />
                {change > 0 && (
                  <p style={{ color: '#10b981', fontSize: '1rem', fontWeight: 'bold' }}>
                    Change: ${change.toFixed(2)}
                  </p>
                )}
              </div>

              <button
                onClick={handlePayment}
                disabled={cartItems.length === 0}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: cartItems.length === 0 ? '#374151' : '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Complete Sale
              </button>
            </div>
          </div>
        )}
      </div>

      {scannerVisible && (
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
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #374151',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={24} />
                Barcode Scanner
              </h2>
              <button
                onClick={stopScanner}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                <X size={20} />
                Close
              </button>
            </div>
            <div
              id="barcode-scanner"
              style={{
                marginBottom: '1rem',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            />
            <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '0.875rem' }}>
              Position barcode within the camera view
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}

