import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Product } from '@/types';
import { getCurrencySettings, formatPrice } from '@/lib/currency';
import { useRouter } from 'next/router';
import { useLanguage } from '@/contexts/LanguageContext';

const LandingPage = dynamic(() => import('@/components/LandingPage'), { ssr: false });

export default function Home() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [displayCurrency, setDisplayCurrency] = useState('SP');
  const router = useRouter();
  const [showNoPlatform, setShowNoPlatform] = useState(false);

  const { setLanguage } = useLanguage();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get platform from URL parameter - REQUIRED
        const platform = router.query.platform as string;
        
        // If no platform parameter, show blank page
        if (!platform) {
          setShowNoPlatform(true);
          setLoading(false);
          return;
        }
        
        setShowNoPlatform(false);
        
        // Load platform default language and set it if customer has no preference
        try {
          const settingsResponse = await fetch(`/api/settings?platform=${platform}`);
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            const defaultLang = settingsData.language || 'ar';
            
            // Check if customer has a saved preference
            const customerLang = typeof window !== 'undefined' ? localStorage.getItem('customerLanguage') : null;
            if (!customerLang && typeof window !== 'undefined') {
              // No customer preference, use platform default
              setLanguage(defaultLang as 'ar' | 'en');
              localStorage.setItem('customerLanguage', defaultLang);
            }
          }
        } catch (error) {
          console.error('Error loading language settings:', error);
        }
        
        // Load currency settings
        const settings = await getCurrencySettings();
        setExchangeRate(settings.exchangeRate);
        setDisplayCurrency(settings.displayCurrency);
        
        // Load products with platform filter
        const response = await fetch(`/api/products?platform=${platform}`);
        const data = await response.json();
        // Convert MongoDB _id to id for Product type
        const formattedData = data.map((item: any) => ({
          ...item,
          id: item._id?.toString() || item.id,
        }));
        setProducts(formattedData);
        setFilteredProducts(formattedData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (router.isReady) {
      loadData();
    }
  }, [router.isReady, router.query.platform, setLanguage]);

  // Show landing page if no platform
  if (showNoPlatform) {
    return <LandingPage />;
  }

  const handleFilter = (filtered: Product[]) => {
    setFilteredProducts(filtered);
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 2rem', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>{t('home.loadingProducts')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: '4rem', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.75rem',
          letterSpacing: '-0.03em',
          lineHeight: '1.2'
        }}>
          {t('home.discoverCollection')}
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: 'var(--text-secondary)',
          letterSpacing: '-0.01em'
        }}>
          {t('home.elegantPieces')}
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
          border: '1px solid var(--border-subtle)',
          direction: language === 'ar' ? 'rtl' : 'ltr'
        }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            {t('home.noProducts')}
          </p>
        </div>
      )}
    </Layout>
  );
}
