import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import productsData from '@/data/products.json';
import { Product } from '@/types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(productsData as Product[]);
    setFilteredProducts(productsData as Product[]);
  }, []);

  const handleFilter = (filtered: Product[]) => {
    setFilteredProducts(filtered);
  };

  return (
    <Layout>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ec4899', fontWeight: 'bold' }}>
          اكتشفي مجموعتنا
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#d1d5db' }}>
          قطع أنيقة للمرأة العصرية
        </p>
      </div>

      <ProductFilters products={products} onFilter={handleFilter} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2rem',
        }}
      >
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>لم يتم العثور على منتجات تطابق معايير البحث.</p>
        </div>
      )}
    </Layout>
  );
}
