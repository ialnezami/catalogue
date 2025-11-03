import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingBag, Globe } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface LayoutProps {
  children: ReactNode;
}

interface PlatformInfo {
  name: string;
  logo?: string;
}

export default function Layout({ children }: LayoutProps) {
  const { getTotalItems } = useCart();
  const { language, setLanguage, t, isLoading: langLoading } = useLanguage();
  const router = useRouter();
  const [platform, setPlatform] = useState<string | null>(null);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [platformLanguage, setPlatformLanguage] = useState<string>('ar');

  useEffect(() => {
    // Get platform from session cookie (for admins) or URL parameter (for public pages)
    const loadPlatform = async () => {
      if (typeof window !== 'undefined') {
        let platformCode: string | null = null;
        
        // First, try to get platform from session cookie (for authenticated admins)
        try {
          const authResponse = await fetch('/api/auth/check');
          const authData = await authResponse.json();
          
          if (authData.adminPlatform) {
            platformCode = authData.adminPlatform;
          }
        } catch (error) {
          console.error('Error fetching auth check:', error);
        }
        
        // Fallback to URL parameter (for public pages)
        if (!platformCode) {
          const urlParams = new URLSearchParams(window.location.search);
          const platformParam = urlParams.get('platform');
          if (platformParam) {
            platformCode = platformParam;
          }
        }

        setPlatform(platformCode);

        // Fetch platform info if we have a platform code
        if (platformCode) {
          try {
            const platformResponse = await fetch(`/api/platforms/${platformCode}`);
            if (platformResponse.ok) {
              const platformData = await platformResponse.json();
              setPlatformInfo({
                name: platformData.name,
                logo: platformData.logo || '',
              });
              
              // Load platform default language from settings
              const settingsResponse = await fetch(`/api/settings?platform=${platformCode}`);
              if (settingsResponse.ok) {
                const settingsData = await settingsResponse.json();
                const defaultLang = settingsData.language || platformData.language || 'ar';
                setPlatformLanguage(defaultLang);
                
                // Always respect platform default if customer hasn't explicitly set a preference
                const customerLang = localStorage.getItem('customerLanguage');
                if (!customerLang) {
                  // Set platform default language
                  setLanguage(defaultLang as 'ar' | 'en');
                  // Also update localStorage to persist this as customer preference
                  localStorage.setItem('customerLanguage', defaultLang);
                } else {
                  // Customer has a preference, but update document direction
                  document.documentElement.dir = customerLang === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.lang = customerLang;
                }
              } else {
                // If settings don't exist yet, use platform language directly
                const defaultLang = platformData.language || 'ar';
                setPlatformLanguage(defaultLang);
                const customerLang = localStorage.getItem('customerLanguage');
                if (!customerLang) {
                  setLanguage(defaultLang as 'ar' | 'en');
                  localStorage.setItem('customerLanguage', defaultLang);
                }
              }
            } else {
              // If platform not found, use defaults
              setPlatformInfo(null);
            }
          } catch (error) {
            console.error('Error fetching platform info:', error);
            setPlatformInfo(null);
          }
        } else {
          setPlatformInfo(null);
        }
      }
    };
    
    loadPlatform();
  }, [router.query]);

  // Get the appropriate href based on platform
  const getProductsHref = () => {
    if (platform) {
      return `/?platform=${platform}`;
    }
    return '/';
  };

  const getAdminHref = () => {
    if (platform) {
      return `/admin/products?platform=${platform}`;
    }
    return '/admin/products';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header
        style={{
          background: 'var(--bg-card)',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link 
            href={getProductsHref()} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              textDecoration: 'none'
            }}
          >
            {(platformInfo?.logo || '/images/logo.PNG') && (
              <img 
                src={platformInfo?.logo || '/images/logo.PNG'} 
                alt={platformInfo?.name || 'Logo'} 
                width={40}
                height={40}
                style={{ 
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={(e) => {
                  // Fallback to default logo if platform logo fails to load
                  if (e.currentTarget.src !== '/images/logo.PNG') {
                    e.currentTarget.src = '/images/logo.PNG';
                  }
                }}
              />
            )}
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {platformInfo?.name || 'stylish'}
            </span>
          </Link>
          <nav className="main-nav" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link
              href={getProductsHref()}
              className="nav-link"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {t('nav.products')}
            </Link>
            <Link href="/cart" className="cart-link" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={22} style={{ color: 'var(--text-secondary)' }} />
              {getTotalItems() > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: language === 'ar' ? '-8px' : 'auto',
                    left: language === 'en' ? '-8px' : 'auto',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    boxShadow: '0 2px 6px rgba(236, 72, 153, 0.4)',
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
            </Link>
            
            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--text-secondary)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Globe size={18} />
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {language === 'ar' ? 'ع' : 'EN'}
                </span>
              </button>
              
              {showLanguageSelector && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998,
                    }}
                    onClick={() => setShowLanguageSelector(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.5rem)',
                      right: language === 'ar' ? 0 : 'auto',
                      left: language === 'en' ? 0 : 'auto',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      padding: '0.5rem',
                      minWidth: '120px',
                      zIndex: 999,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <button
                      onClick={() => {
                        setLanguage('ar');
                        setShowLanguageSelector(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.625rem 1rem',
                        background: language === 'ar' ? 'var(--accent-primary)' : 'transparent',
                        color: language === 'ar' ? '#ffffff' : 'var(--text-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textAlign: 'right',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (language !== 'ar') {
                          e.currentTarget.style.background = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (language !== 'ar') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setShowLanguageSelector(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.625rem 1rem',
                        background: language === 'en' ? 'var(--accent-primary)' : 'transparent',
                        color: language === 'en' ? '#ffffff' : 'var(--text-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textAlign: 'left',
                        marginTop: '0.25rem',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (language !== 'en') {
                          e.currentTarget.style.background = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (language !== 'en') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      English
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <Link
              href={getAdminHref()}
              className="nav-link"
              style={{
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                padding: '0.625rem 1.25rem',
                borderRadius: '20px',
                background: 'transparent',
                border: '1px solid var(--text-primary)',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--success)';
                e.currentTarget.style.borderColor = 'var(--success)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--text-primary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              {t('nav.admin')}
            </Link>
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }} className="main-content">
        {children}
      </main>
    </div>
  );
}

