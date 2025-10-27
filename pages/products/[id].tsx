import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import productsData from '@/data/products.json';
import { Product } from '@/types';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      const foundProduct = productsData.find((p) => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct as Product);
      }
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  if (!product) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>Loading product...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#ec4899',
          marginBottom: '2rem',
          transition: 'color 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#db2777';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#ec4899';
        }}
      >
        <ArrowLeft size={20} />
        العودة للمنتجات
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #374151',
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: '#2a2a2a',
              backgroundImage: `url(/images/${product.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <img
              src={`/images/${product.image}`}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div>
          <div style={{ color: '#ec4899', fontSize: '1rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
            {product.category}
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#ffffff' }}>
            {product.title}
          </h1>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ec4899', marginBottom: '2rem' }}>
            ${product.price.toFixed(2)}
          </div>
          <p style={{ fontSize: '1.125rem', lineHeight: '1.75', color: '#d1d5db', marginBottom: '3rem' }}>
            {product.description}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleAddToCart}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '1rem 2rem',
                backgroundColor: '#ec4899',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#db2777';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ec4899';
              }}
            >
              <ShoppingCart size={24} />
              إضافة للسلة
            </button>
          </div>

          <div
            style={{
              marginTop: '3rem',
              padding: '1.5rem',
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #374151',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#ffffff' }}>تفاصيل المنتج</h3>
            <div style={{ color: '#d1d5db', lineHeight: '2' }}>
              <p>مواد عالية الجودة</p>
              <p>الشحن مجاني للطلبات أكثر من $100</p>
              <p>سياسة إرجاع لمدة 30 يوم</p>
              <p>خيارات دفع آمنة</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
