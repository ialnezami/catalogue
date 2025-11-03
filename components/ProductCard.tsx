import { Product } from '@/types';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, getCurrencySettings } from '@/lib/currency';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [displayCurrency, setDisplayCurrency] = useState('SP');
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    getCurrencySettings().then(settings => {
      setExchangeRate(settings.exchangeRate);
      setDisplayCurrency(settings.displayCurrency);
    });
  }, []);

  useEffect(() => {
    // Load platform from session or URL
    const loadPlatform = async () => {
      if (typeof window !== 'undefined') {
        try {
          const authResponse = await fetch('/api/auth/check');
          const authData = await authResponse.json();
          
          if (authData.adminPlatform) {
            setPlatform(authData.adminPlatform);
            return;
          }
        } catch (error) {
          console.error('Error fetching auth check:', error);
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const platformParam = urlParams.get('platform');
        if (platformParam) {
          setPlatform(platformParam);
        }
      }
    };
    
    loadPlatform();
  }, [router.query]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const getProductHref = () => {
    const baseHref = `/products/${product.id}`;
    if (platform) {
      return `${baseHref}?platform=${platform}`;
    }
    return baseHref;
  };

  return (
    <Link href={getProductHref()}>
      <div
        className="product-card"
        style={{
          overflow: 'hidden',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            backgroundColor: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: product.image.startsWith('http') ? `url(${product.image})` : `url(/images/${product.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {product.image && (
            <img 
              src={product.image.startsWith('http') ? product.image : `/images/${product.image}`} 
              alt={product.title}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          )}
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
            color: 'var(--text-primary)', 
            lineHeight: '1.5',
            letterSpacing: '-0.01em'
          }}>
            {product.title}
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.8125rem', 
            marginBottom: '1rem', 
            flexGrow: 1, 
            lineHeight: '1.6', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            fontWeight: '300'
          }}>
            {product.description}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.03em' 
            }}>
              {formatPrice(product.price, exchangeRate, displayCurrency)}
            </span>
            <button
              onClick={handleAddToCart}
              style={{
                background: 'transparent',
                border: '1px solid var(--text-primary)',
                color: 'var(--text-primary)',
                padding: '0.625rem 1.25rem',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-primary)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--text-primary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <ShoppingCart size={14} />
              {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

