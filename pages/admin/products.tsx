import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, LogOut, ShoppingCart, FileText, Download, Upload, X, Settings, Barcode, Printer } from 'lucide-react';
import { Product } from '@/types';
import { useRouter } from 'next/router';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    image: '',
    barcode: '',
    buyPrice: '',
    qty: '',
    note: '',
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Get platform from URL or use 'default'
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform') || 'default';
    
    setPlatform(platformParam);
    loadProducts();
  }, []);

  const generateBarcode = () => {
    const barcode = 'PRD' + Date.now().toString().slice(-10);
    setGeneratedBarcode(barcode);
    setFormData({ ...formData, barcode });
    
    // Generate barcode canvas
    if (barcodeCanvasRef.current) {
      setTimeout(() => {
        try {
          JsBarcode(barcodeCanvasRef.current!, barcode, {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: true
          });
        } catch (error) {
          console.error('Error generating barcode:', error);
        }
      }, 100);
    }
  };

  const printBarcode = () => {
    if (!barcodeCanvasRef.current || !generatedBarcode) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode Print</title>
            <style>
              @media print {
                @page { margin: 0; size: 80mm 40mm; }
                body { margin: 0; padding: 10px; }
              }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                text-align: center;
              }
              .barcode-container {
                margin: 10px 0;
              }
              .product-info {
                margin-top: 10px;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="product-info">
              <strong>${formData.title || 'Product'}</strong><br>
              <span>${formData.category || 'Category'}</span>
            </div>
            <div class="barcode-container">
              <img src="${barcodeCanvasRef.current.toDataURL()}" alt="Barcode" />
            </div>
            <div class="product-info">
              SKU: ${generatedBarcode}
            </div>
            <script>
              window.onload = () => setTimeout(() => window.print(), 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const loadProducts = async () => {
    try {
      if (!platform) return;
      
      const response = await fetch(`/api/products?platform=${platform}`);
      const data = await response.json();
      // Convert MongoDB _id to id for Product type
      const formattedData = data.map((item: any) => ({
        ...item,
        id: item._id?.toString() || item.id,
      }));
      setProducts(formattedData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!platform) {
      toast.error('Platform required!');
      return;
    }
    
    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}?platform=${platform}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Product updated successfully!');
      } else {
        await fetch(`/api/products?platform=${platform}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Product created successfully!');
      }
      
      setShowEditModal(false);
      setEditingProduct(null);
      setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error saving product!');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const formDataObj = {
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      barcode: product.barcode || '',
      buyPrice: product.buyPrice?.toString() || '',
      qty: product.qty?.toString() || '',
      note: product.note || '',
    };
    setFormData(formDataObj);
    
    // If product has barcode, generate barcode display
    if (product.barcode) {
      setGeneratedBarcode(product.barcode);
      setTimeout(() => {
        if (barcodeCanvasRef.current && product.barcode) {
          try {
            JsBarcode(barcodeCanvasRef.current, product.barcode, {
              format: 'CODE128',
              width: 2,
              height: 60,
              displayValue: true
            });
          } catch (error) {
            console.error('Error generating barcode:', error);
          }
        }
      }, 100);
    } else {
      setGeneratedBarcode('');
    }
    
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product!');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const downloadTemplate = () => {
    const csvContent = `title,description,price,category,image,barcode,buyPrice,qty,note
Rose Gold Ring,Elegant ring with diamond,299.99,Rings,ring-1.jpg,123456789,150.00,10,Special edition
Silver Necklace,Beautiful necklace with pendant,199.99,Necklaces,necklace-1.jpg,123456790,100.00,5,From Italy
Pearl Earrings,Classic pearl studs,149.99,Earrings,earrings-1.jpg,123456791,75.00,8,Popular item
Gold Bracelet,Delicate chain bracelet,249.99,Bracelets,bracelet-1.jpg,123456792,120.00,3,Limited stock`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    console.log('File upload triggered:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    console.log('File validated:', file.name);
    
    setIsUploading(false);
    setIsParsing(true);
    setUploadProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have header and at least one product');
        setIsUploading(false);
        return;
      }

      const headers = parseCSVLine(lines[0]);
      console.log('Headers:', headers);
      console.log('Total lines:', lines.length);
      
      const products = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const product: any = {};
        
        headers.forEach((header, index) => {
          product[header] = values[index]?.trim() || '';
        });

        // Only add products with title
        if (product.title) {
          products.push(product);
          console.log('Product added:', product.title);
        }
      }

      console.log('Total products parsed:', products.length);

      if (products.length === 0) {
        toast.error('No valid products found in CSV');
        setIsUploading(false);
        setIsParsing(false);
        setUploadProgress(0);
        return;
      }

      // Show preview modal with parsed products
      setParsedProducts(products);
      // Select all products by default
      setSelectedProducts(new Set(products.map((_, index) => index)));
      setIsUploading(false);
      setIsParsing(false);
      setShowImportModal(false);
      setShowPreviewModal(true);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error parsing products:', error);
      toast.error('Error parsing CSV: ' + (error as Error).message);
      setIsUploading(false);
      setIsParsing(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const handleImportSelected = async () => {
    const productsToImport = parsedProducts.filter((_, index) => selectedProducts.has(index));
    
    if (productsToImport.length === 0) {
      toast.error('Please select at least one product to import');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Import selected products one by one with progress
      for (let i = 0; i < productsToImport.length; i++) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productsToImport[i]),
        });
        
        const progress = ((i + 1) / productsToImport.length) * 100;
        setUploadProgress(Math.round(progress));
      }

      toast.success(`Successfully imported ${productsToImport.length} products!`);
      setShowPreviewModal(false);
      setUploadProgress(0);
      setIsUploading(false);
      setSelectedProducts(new Set());
      loadProducts();
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error('Error importing products: ' + (error as Error).message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleProductSelection = (index: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    setSelectedProducts(new Set(parsedProducts.map((_, index) => index)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  const updateParsedProduct = (index: number, field: string, value: string) => {
    const updated = [...parsedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setParsedProducts(updated);
  };

  const removeParsedProduct = (index: number) => {
    const updated = parsedProducts.filter((_, i) => i !== index);
    setParsedProducts(updated);
    const newSelected = new Set(Array.from(selectedProducts).filter(i => i !== index).map(i => i > index ? i - 1 : i));
    setSelectedProducts(newSelected);
  };


  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: '#9ca3af' }}>Loading products...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', color: '#000000', fontWeight: '700', letterSpacing: '-0.03em' }}>Products Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => router.push('/pos')}
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
            <ShoppingCart size={20} />
            POS
          </button>
          <button
            onClick={() => router.push('/admin/orders')}
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
            <FileText size={20} />
            Orders
          </button>
          <button
            onClick={() => router.push('/admin/settings')}
            style={{
              backgroundColor: '#8b5cf6',
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
            <Settings size={20} />
            Settings
          </button>
          <button
            onClick={downloadTemplate}
            style={{
              backgroundColor: '#f59e0b',
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
            <Download size={20} />
            Download Template
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              backgroundColor: '#8b5cf6',
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
            <Upload size={20} />
            Import CSV
          </button>
          <button
              onClick={() => {
      setEditingProduct(null);
      setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
      setGeneratedBarcode('');
      generateBarcode();
      setShowEditModal(true);
            }}
            style={{
              backgroundColor: '#ec4899',
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
            <Plus size={20} />
            Add Product
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
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Edit Product Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '2.5rem',
              borderRadius: '0',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', color: '#000000', fontWeight: '600', letterSpacing: '-0.02em' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999999',
                  cursor: 'pointer',
                  padding: '0.5rem',
                }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Title</label>
                <input
                  className="input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Category</label>
                <input
                  className="input"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Description</label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Selling Price</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Buy Price (Admin Only)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  placeholder="Cost price"
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Image URL</label>
              <input
                className="input"
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Barcode</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Product barcode"
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  onClick={generateBarcode}
                  style={{
                    padding: '0.875rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid #000000',
                    color: '#000000',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  <Barcode size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Generate
                </button>
                {generatedBarcode && formData.barcode && (
                  <button
                    type="button"
                    onClick={printBarcode}
                    style={{
                      padding: '0.875rem 1.25rem',
                      background: '#000000',
                      border: '1px solid #000000',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#333333';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#000000';
                    }}
                  >
                    <Printer size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Print
                  </button>
                )}
              </div>
              {generatedBarcode && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
                  <canvas ref={barcodeCanvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <input
                  className="input"
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  placeholder="Stock quantity"
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600' }}>Internal Notes (Admin Only)</label>
              <textarea
                className="input"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                placeholder="Private notes about this product"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
                }}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0',
                  border: '1px solid #000000',
                  background: 'transparent',
                  color: '#000000',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#000000';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#000000';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '0.875rem 2rem',
                }}
              >
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      <div 
        className="responsive-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="product-card"
            style={{
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ 
              width: '100%', 
              aspectRatio: '1', 
              backgroundColor: '#fafafa',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <img
                src={product.image.startsWith('http') ? product.image : `/images/${product.image}`}
                alt={product.title}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>
            <div style={{ 
              padding: '1.5rem 1.25rem',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ 
                color: 'var(--text-tertiary)', 
                fontSize: '0.6875rem', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                marginBottom: '0.75rem', 
                letterSpacing: '0.1em' 
              }}>
                {product.category}
              </div>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '400', 
                marginBottom: '0.5rem', 
                color: '#000000', 
                lineHeight: '1.5',
                letterSpacing: '-0.01em' 
              }}>
                {product.title}
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: '#000000', 
                  letterSpacing: '-0.03em',
                  margin: 0
                }}>
                  ${product.price}
                </p>
              </div>
              
              {/* Admin Info Section */}
              <div style={{ 
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem'
              }}>
                {product.barcode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Barcode:</span>
                    <strong>{product.barcode}</strong>
                  </div>
                )}
                {product.buyPrice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>Profit:</span>
                    <strong>${(product.price - product.buyPrice).toFixed(2)}</strong>
                  </div>
                )}
                {product.qty !== undefined && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: product.qty > 0 ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    <span>Stock:</span>
                    <strong>{product.qty > 0 ? `${product.qty}` : 'Out of Stock'}</strong>
                  </div>
                )}
                {product.note && (
                  <div style={{ 
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                    color: '#666666'
                  }}>
                    📝 {product.note}
                  </div>
                )}
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                marginTop: '1rem'
              }}>
                <button
                  onClick={() => handleEdit(product)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#000000',
                    padding: '0.625rem 1rem',
                    borderRadius: '0',
                    border: '1px solid #000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#ef4444',
                    padding: '0.625rem 1rem',
                    borderRadius: '0',
                    border: '1px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Import CSV Modal */}
      {showImportModal && (
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
          onClick={() => setShowImportModal(false)}
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
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={24} />
                Import Products
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
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

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#d1d5db', marginBottom: '1rem' }}>
                Upload a CSV file with products. Make sure the CSV has the following columns:
              </p>
              <div style={{ background: '#2a2a2a', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', color: '#9ca3af' }}>
                <code>title, description, price, category, image, barcode, buyPrice, qty, note</code>
              </div>
            </div>

            {!isUploading ? (
              <label
                htmlFor="csv-upload-input"
                onClick={() => {
                  console.log('Upload area clicked');
                  csvFileInputRef.current?.click();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '1.5rem',
                  border: '2px dashed #3b82f6',
                  borderRadius: '12px',
                  backgroundColor: '#2a2a2a',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  opacity: isUploading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isUploading) {
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUploading) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }
                }}
              >
                <Upload size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Click to select CSV file</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>or drag and drop</p>
                <input
                  ref={csvFileInputRef}
                  id="csv-upload-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
              </label>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.5rem',
                  color: '#ffffff'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Uploading products...</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{uploadProgress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                    borderRadius: '6px',
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                  }} />
                </div>
                <p style={{ 
                  color: '#9ca3af', 
                  fontSize: '0.75rem', 
                  textAlign: 'center', 
                  marginTop: '0.5rem' 
                }}>
                  Please wait while products are being created...
                </p>
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={downloadTemplate}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: isUploading ? '#374151' : '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: isUploading ? 0.5 : 1,
                }}
              >
                <Download size={18} />
                Download Template
              </button>
              <button
                onClick={() => {
                  if (!isUploading) {
                    setShowImportModal(false);
                  }
                }}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  opacity: isUploading ? 0.5 : 1,
                }}
              >
                {isUploading ? 'Processing...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
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
            padding: '2rem',
          }}
          onClick={() => {
            if (!isUploading) setShowPreviewModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #374151',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={24} />
                Preview Products ({selectedProducts.size} selected)
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isUploading && (
                  <>
                    <button
                      onClick={selectAllProducts}
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
                      Select All
                    </button>
                    <button
                      onClick={deselectAllProducts}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6b7280',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Deselect All
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.5rem',
                  }}
                  disabled={isUploading}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', marginBottom: '1rem' }}>
              {parsedProducts.map((product, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: selectedProducts.has(index) ? '#2a2a2a' : '#1f1f1f',
                    border: selectedProducts.has(index) ? '2px solid #3b82f6' : '1px solid #374151',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(index)}
                      onChange={() => toggleProductSelection(index)}
                      disabled={isUploading}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                      }}
                    />
                    <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={product.title || ''}
                          onChange={(e) => updateParsedProduct(index, 'title', e.target.value)}
                          placeholder="Title"
                          disabled={isUploading}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff',
                          }}
                        />
                        <input
                          type="text"
                          value={product.description || ''}
                          onChange={(e) => updateParsedProduct(index, 'description', e.target.value)}
                          placeholder="Description"
                          disabled={isUploading}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff',
                          }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        <input
                          type="number"
                          value={product.price || ''}
                          onChange={(e) => updateParsedProduct(index, 'price', e.target.value)}
                          placeholder="Price"
                          disabled={isUploading}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff',
                          }}
                        />
                        <input
                          type="text"
                          value={product.category || ''}
                          onChange={(e) => updateParsedProduct(index, 'category', e.target.value)}
                          placeholder="Category"
                          disabled={isUploading}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff',
                          }}
                        />
                        <input
                          type="text"
                          value={product.barcode || ''}
                          onChange={(e) => updateParsedProduct(index, 'barcode', e.target.value)}
                          placeholder="Barcode"
                          disabled={isUploading}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff',
                          }}
                        />
                        <button
                          onClick={() => removeParsedProduct(index)}
                          disabled={isUploading}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            {isUploading ? (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.5rem',
                  color: '#ffffff'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Importing products...</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{uploadProgress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                    borderRadius: '6px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#374151',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSelected}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Import {selectedProducts.size} Product{selectedProducts.size !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

