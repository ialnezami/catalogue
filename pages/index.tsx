import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Product } from '@/types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        // Convert MongoDB _id to id for Product type
        const formattedData = data.map((item: any) => ({
          ...item,
          id: item._id?.toString() || item.id,
        }));
        setProducts(formattedData);
        setFilteredProducts(formattedData);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleFilter = (filtered: Product[]) => {
    setFilteredProducts(filtered);
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>جاري تحميل المنتجات...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.75rem',
          letterSpacing: '-0.03em',
          lineHeight: '1.2'
        }}>
          اكتشفي مجموعتنا
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: 'var(--text-secondary)',
          letterSpacing: '-0.01em'
        }}>
          قطع أنيقة للمرأة العصرية
        </p>
      </div>

      <ProductFilters products={products} onFilter={handleFilter} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}
        className="responsive-grid"
      >
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            لم يتم العثور على منتجات تطابق معايير البحث.
          </p>
        </div>
      )}
    </Layout>
  );
}
