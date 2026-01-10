import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types';
import { ShoppingCart, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    // Load platform from session or URL
    const loadPlatform = async () => {
      if (typeof window !== 'undefined') {
        try {
          const authResponse = await fetch('/api/auth/check');
          const authData = await authResponse.json();
          
          if (authData.adminPlatform) {
            setPlatform(authData.adminPlatform);
            sessionStorage.setItem('currentPlatform', authData.adminPlatform);
            return;
          }
        } catch (error) {
          console.error('Error fetching auth check:', error);
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const platformParam = urlParams.get('platform');
        if (platformParam) {
          setPlatform(platformParam);
          sessionStorage.setItem('currentPlatform', platformParam);
        } else {
          // Fallback to default if no platform in URL
          const defaultPlatform = 'default';
          sessionStorage.setItem('currentPlatform', defaultPlatform);
        }
      }
    };
    
    loadPlatform();
  }, []);

  useEffect(() => {
    if (id) {
      const loadProduct = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/products/${id}`);
          if (response.ok) {
            const data = await response.json();
            setProduct({
              ...data,
              id: data._id?.toString() || data.id,
            });
          }
        } catch (error) {
          console.error('Error loading product:', error);
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  const copyProductLink = async () => {
    const productUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(productUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading || !product) {
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
        href={platform ? `/?platform=${platform}` : '/'}
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
              backgroundImage: product.image.startsWith('http') ? `url(${product.image})` : `url(/images/${product.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <img
              src={product.image.startsWith('http') ? product.image : `/images/${product.image}`}
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
            <button
              onClick={copyProductLink}
              style={{
                padding: '1rem 2rem',
                backgroundColor: linkCopied ? '#10b981' : '#2a2a2a',
                color: '#ffffff',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!linkCopied) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!linkCopied) {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
            >
              <LinkIcon size={24} />
              {linkCopied ? 'تم النسخ!' : 'نسخ رابط المنتج'}
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
