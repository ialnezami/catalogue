import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, LogOut, ShoppingCart, FileText, Download, Upload, X, Settings, Barcode, Printer, Search, Filter, Package, TrendingUp, DollarSign, Globe } from 'lucide-react';
import { Product } from '@/types';
import { useRouter } from 'next/router';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();
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
  const [importUrl, setImportUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'stock'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      loadProducts();
      loadSettings();
    }
  }, [platform]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.language && data.language !== language) {
        setLanguage(data.language);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Use i18n t function - translations are in JSON files

  // Modal translations now use i18n - keys are in JSON files

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Cloudinary via API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Set the Cloudinary URL in the form
      setFormData((prev) => ({ ...prev, image: data.url }));
      setImagePreview(data.url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  };

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
      // API automatically uses admin's platform from cookie
      const response = await fetch('/api/products');
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

  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.barcode?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price':
          return a.price - b.price;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'stock':
          return (b.qty || 0) - (a.qty || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Calculate statistics
  const stats = {
    total: products.length,
    inStock: products.filter((p) => (p.qty || 0) > 0).length,
    outOfStock: products.filter((p) => (p.qty || 0) === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * (p.qty || 0)), 0),
    avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // API automatically uses admin's platform from cookie
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Product updated successfully!');
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Product created successfully!');
      }
      
      setShowEditModal(false);
      setEditingProduct(null);
      setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
      setImagePreview(null);
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
    setImagePreview(product.image || null);
    
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

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      toast.error('Please enter a CSV URL');
      return;
    }

    // Validate URL
    try {
      new URL(importUrl);
    } catch (e) {
      toast.error('Invalid URL');
      return;
    }

    setIsLoadingUrl(true);
    try {
      // Fetch CSV from URL
      const response = await fetch(importUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      
      // Parse CSV same way as file upload
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV must have header and at least one product');
        setIsLoadingUrl(false);
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const products = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const product: any = {};
        
        headers.forEach((header, index) => {
          product[header] = values[index]?.trim() || '';
        });

        if (product.title) {
          products.push(product);
        }
      }

      if (products.length === 0) {
        toast.error('No valid products found in CSV');
        setIsLoadingUrl(false);
        return;
      }

      // Show preview modal with parsed products
      setParsedProducts(products);
      setSelectedProducts(new Set(products.map((_, index) => index)));
      setIsLoadingUrl(false);
      setShowImportModal(false);
      setShowPreviewModal(true);
      setImportUrl('');
      
    } catch (error) {
      console.error('Error fetching CSV:', error);
      toast.error('Error loading CSV from URL: ' + (error as Error).message);
      setIsLoadingUrl(false);
    }
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
        <div style={{ 
          textAlign: 'center', 
          padding: '6rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280', fontSize: '1.125rem', fontWeight: '500' }}>{language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Improved Header Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.75rem', 
              color: '#111827', 
              fontWeight: '800', 
              letterSpacing: '-0.04em',
              marginBottom: '0.5rem',
              lineHeight: '1.1',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              {t('admin.productsManagement')}
            </h1>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1rem',
              fontWeight: '400',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              {t('admin.manageCatalog', { count: stats.total })}
            </p>
          </div>
          
          {/* Action Buttons - Reorganized */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
                setImagePreview(null);
                setGeneratedBarcode('');
                setShowEditModal(true);
              }}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              <Plus size={20} />
              {t('admin.addProduct')}
            </button>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => router.push('/pos')}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#3b82f6',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <ShoppingCart size={18} />
                {t('admin.pos')}
              </button>
              <button
                onClick={() => router.push('/admin/orders')}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#10b981',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <FileText size={18} />
                {t('admin.orders')}
              </button>
              <button
                onClick={() => router.push('/admin/settings')}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#8b5cf6',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.backgroundColor = '#faf5ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <Settings size={18} />
              </button>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ffffff',
                color: '#ef4444',
                padding: '0.875rem 1.25rem',
                borderRadius: '12px',
                border: '1.5px solid #fee2e2',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#fee2e2';
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '600' }}>{t('admin.totalProducts')}</div>
              <Package size={20} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827' }}>{stats.total}</div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '600' }}>{t('admin.inStock')}</div>
              <TrendingUp size={20} color="#10b981" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{stats.inStock}</div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '600' }}>{t('admin.outOfStock')}</div>
              <Package size={20} color="#ef4444" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444' }}>{stats.outOfStock}</div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '600' }}>{t('admin.totalValue')}</div>
              <DollarSign size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>
              ${stats.totalValue.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.searchPlaceholder')}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  fontSize: '0.9375rem',
                  color: '#111827',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} color="#6b7280" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  fontSize: '0.9375rem',
                  color: '#111827',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minWidth: '150px',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="all">{t('admin.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                padding: '0.875rem 1.25rem',
                borderRadius: '12px',
                border: '1.5px solid #e5e7eb',
                backgroundColor: '#ffffff',
                fontSize: '0.9375rem',
                color: '#111827',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '140px',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="name">{t('admin.sortName')}</option>
              <option value="price">{t('admin.sortPrice')}</option>
              <option value="category">{t('admin.sortCategory')}</option>
              <option value="stock">{t('admin.sortStock')}</option>
            </select>

            {/* Secondary Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <button
                onClick={downloadTemplate}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <Upload size={16} />
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div style={{ 
            marginTop: '1rem', 
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {t('admin.showing')} <strong style={{ color: '#111827' }}>{filteredProducts.length}</strong> {t('admin.of')} <strong style={{ color: '#111827' }}>{stats.total}</strong> {t('admin.products')}
              {searchQuery && ` ${t('admin.matching')} "${searchQuery}"`}
              {selectedCategory !== 'all' && ` ${t('admin.in')} "${selectedCategory}"`}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#3b82f6',
                  borderRadius: '8px',
                  border: '1px solid #3b82f6',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {t('admin.clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '4rem 2rem',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <Package size={64} color="#d1d5db" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            {searchQuery || selectedCategory !== 'all' ? t('admin.noProductsFound') : t('admin.noProductsYet')}
          </h3>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1rem',
            marginBottom: '2rem',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}>
            {searchQuery || selectedCategory !== 'all' 
              ? t('admin.tryAdjusting')
              : t('admin.getStarted')}
          </p>
          {(!searchQuery && selectedCategory === 'all') && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
                setImagePreview(null);
                setGeneratedBarcode('');
                setShowEditModal(true);
              }}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '0.875rem 2rem',
                borderRadius: '12px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={20} />
              {t('admin.addFirstProduct')}
            </button>
          )}
        </div>
      ) : (
        <div 
          className="responsive-grid"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
            gap: '1.5rem' 
          }}
        >
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Stock Badge */}
              {(product.qty || 0) === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}>
                  Out of Stock
                </div>
              )}
              
              <div style={{ 
                width: '100%', 
                aspectRatio: '1', 
                backgroundColor: '#fafafa',
                overflow: 'hidden',
                position: 'relative',
                background: `linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)`
              }}>
                <img
                  src={product.image.startsWith('http') ? product.image : `/images/${product.image}`}
                  alt={product.title}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </div>
              <div style={{ 
                padding: '1.5rem',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ 
                  color: '#8b5cf6', 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  marginBottom: '0.75rem', 
                  letterSpacing: '0.1em',
                  backgroundColor: '#faf5ff',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '8px',
                  display: 'inline-block',
                  width: 'fit-content'
                }}>
                  {product.category}
                </div>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  marginBottom: '0.5rem', 
                  color: '#111827', 
                  lineHeight: '1.4',
                  letterSpacing: '-0.02em',
                  minHeight: '3rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {product.title}
                </h3>
                <div style={{ 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.5rem'
                }}>
                  <p style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '800', 
                    color: '#111827', 
                    letterSpacing: '-0.03em',
                    margin: 0
                  }}>
                    ${product.price.toFixed(2)}
                  </p>
                  {product.buyPrice && (
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      (${(product.price - product.buyPrice).toFixed(2)} profit)
                    </span>
                  )}
                </div>
                
                {/* Admin Info Section - Improved */}
                <div style={{ 
                  marginTop: 'auto',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '0.8125rem',
                  color: '#6b7280',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {product.barcode && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Barcode</span>
                        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>{product.barcode}</strong>
                      </div>
                    )}
                    {product.qty !== undefined && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Stock</span>
                        <strong style={{ 
                          color: product.qty > 0 ? '#10b981' : '#ef4444',
                          fontSize: '0.875rem'
                        }}>
                          {product.qty > 0 ? `${product.qty} units` : 'Out of Stock'}
                        </strong>
                      </div>
                    )}
                  </div>
                  {product.note && (
                    <div style={{ 
                      marginTop: '0.25rem',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontStyle: 'italic',
                      color: '#6b7280',
                      borderLeft: '3px solid #8b5cf6'
                    }}>
                      {product.note}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons - Improved */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem',
                  marginTop: '1.25rem'
                }}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      color: '#111827',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#111827';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#111827';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#111827';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                  <Edit2 size={18} />
                  {t('admin.edit')}
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    color: '#ef4444',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = '#fee2e2';
                  }}
                >
                  <Trash2 size={18} />
                  {t('admin.delete')}
                </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <h2 style={{ fontSize: '1.75rem', color: '#000000', fontWeight: '600', letterSpacing: '-0.02em', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                {editingProduct ? t('admin.editProduct') : t('admin.addNewProduct')}
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
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.title')}</label>
                <input
                  className="input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.category')}</label>
                <input
                  className="input"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.description')}</label>
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
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.sellingPrice')}</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.buyPrice')}</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  placeholder={t('admin.costPricePlaceholder')}
                  style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                {t('admin.productImage')}
              </label>
              
              {/* Image Preview */}
              {(imagePreview || formData.image) && (
                <div style={{ marginBottom: '1rem' }}>
                  <img
                    src={imagePreview || formData.image}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                </div>
              )}

              {/* File Upload Button */}
              <div style={{ marginBottom: '0.75rem' }}>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                />
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isUploadingImage ? '#9ca3af' : '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    opacity: isUploadingImage ? 0.6 : 1,
                  }}
                >
                  {isUploadingImage ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      {t('admin.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {t('admin.uploadImage')}
                    </>
                  )}
                </button>
              </div>

              {/* Or Divider */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                <span style={{ padding: '0 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>{t('admin.or')}</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              </div>

              {/* Manual URL Input */}
              <input
                className="input"
                type="text"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value });
                  setImagePreview(e.target.value || null);
                }}
                placeholder={t('admin.imageUrlPlaceholder')}
                required
                style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
              />
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                {t('admin.imageUploadHint')}
              </p>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.barcode')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder={t('admin.barcodePlaceholder')}
                    readOnly
                    style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
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
                    direction: language === 'ar' ? 'rtl' : 'ltr',
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
                  <Barcode size={16} style={{ display: 'inline', marginRight: language === 'ar' ? '0' : '0.5rem', marginLeft: language === 'ar' ? '0.5rem' : '0' }} />
                  {t('admin.generate')}
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
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#333333';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#000000';
                    }}
                  >
                    <Printer size={16} style={{ display: 'inline', marginRight: language === 'ar' ? '0' : '0.5rem', marginLeft: language === 'ar' ? '0.5rem' : '0' }} />
                    {t('admin.print')}
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
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.quantity')}</label>
                <input
                  className="input"
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  placeholder={t('admin.stockQuantity')}
                  style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#333333', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('admin.note')}</label>
              <textarea
                className="input"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                placeholder={t('admin.notePlaceholder')}
                style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
                  setImagePreview(null);
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
                {t('cart.cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '0.875rem 2rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr',
                }}
              >
                {editingProduct ? t('admin.updateProduct') : t('admin.createProduct')}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

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

            {/* URL Import Section */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#2a2a2a', borderRadius: '8px', border: '1px solid #374151' }}>
              <h3 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                📡 Import from URL (Google Sheets, etc.)
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                  disabled={isLoadingUrl || isUploading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                  }}
                />
                <button
                  onClick={handleUrlImport}
                  disabled={isLoadingUrl || isUploading || !importUrl.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isLoadingUrl ? '#374151' : '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (isLoadingUrl || isUploading || !importUrl.trim()) ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: (isLoadingUrl || isUploading || !importUrl.trim()) ? 0.5 : 1,
                  }}
                >
                  {isLoadingUrl ? 'Loading...' : 'Import'}
                </button>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem', marginBottom: 0 }}>
                💡 Works with Google Sheets CSV export URLs
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }}></div>
              <span style={{ padding: '0 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }}></div>
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

