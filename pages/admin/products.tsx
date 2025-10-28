import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, LogOut, ShoppingCart, FileText, Download, Upload, X } from 'lucide-react';
import { Product } from '@/types';
import { useRouter } from 'next/router';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  const router = useRouter();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      barcode: product.barcode || '',
      buyPrice: product.buyPrice?.toString() || '',
      qty: product.qty?.toString() || '',
      note: product.note || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const product: any = {};
      headers.forEach((header, index) => {
        product[header] = values[index]?.trim() || '';
      });

      if (product.title) {
        products.push(product);
      }
    }

    try {
      // Import products one by one
      for (const product of products) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      }

      alert(`Successfully imported ${products.length} products!`);
      setShowImportModal(false);
      loadProducts();
    } catch (error) {
      console.error('Error importing products:', error);
      alert('Error importing products!');
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#ec4899' }}>Admin - Products</h1>
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
      setShowForm(true);
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
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #374151',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem' }}>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Buy Price (Admin Only)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff' }}
                  placeholder="Cost price"
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Image URL</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Barcode (Admin Only)</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff' }}
                  placeholder="Product barcode"
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Quantity (Admin Only)</label>
                <input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff' }}
                  placeholder="Stock quantity"
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Internal Notes (Admin Only)</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff', resize: 'vertical' }}
                placeholder="Private notes about this product"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  setFormData({ title: '', description: '', price: '', category: '', image: '', barcode: '', buyPrice: '', qty: '', note: '' });
                }}
                style={{
                  backgroundColor: '#374151',
                  color: '#ffffff',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              backgroundColor: '#1a1a1a',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #374151',
            }}
          >
            <img
              src={product.image.startsWith('http') ? product.image : `/images/${product.image}`}
              alt={product.title}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
            />
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.5rem' }}>{product.title}</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{product.category}</p>
            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ color: '#ec4899', fontSize: '1.5rem', fontWeight: 'bold', display: 'inline' }}>
                ${product.price}
              </p>
              {product.buyPrice && (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'inline', marginLeft: '0.5rem' }}>
                  (Cost: ${product.buyPrice})
                </p>
              )}
            </div>
            {product.barcode && (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Barcode: <strong style={{ color: '#9ca3af' }}>{product.barcode}</strong>
              </p>
            )}
            {product.buyPrice && (
              <p style={{ color: '#10b981', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Profit: ${(product.price - product.buyPrice).toFixed(2)}
              </p>
            )}
            {product.qty !== undefined && (
              <p style={{ 
                color: product.qty > 0 ? '#10b981' : '#ef4444', 
                fontSize: '0.875rem', 
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                Stock: {product.qty > 0 ? `${product.qty} available` : 'Out of Stock'}
              </p>
            )}
            {product.note && (
              <div style={{ backgroundColor: '#2a2a2a', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', borderLeft: '3px solid #3b82f6' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  <strong>Note:</strong> {product.note}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleEdit(product)}
                style={{
                  flex: 1,
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={18} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={18} />
                Delete
              </button>
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

            <label
              style={{
                display: 'block',
                width: '100%',
                padding: '1.5rem',
                border: '2px dashed #3b82f6',
                borderRadius: '12px',
                backgroundColor: '#2a2a2a',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <Upload size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Click to select CSV file</p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>or drag and drop</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={downloadTemplate}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Download size={18} />
                Download Template
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

