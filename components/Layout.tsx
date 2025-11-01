import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { getTotalItems } = useCart();
  const router = useRouter();
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    // Get platform from session cookie (for admins) or URL parameter (for public pages)
    const loadPlatform = async () => {
      if (typeof window !== 'undefined') {
        // First, try to get platform from session cookie (for authenticated admins)
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
        
        // Fallback to URL parameter (for public pages)
        const urlParams = new URLSearchParams(window.location.search);
        const platformParam = urlParams.get('platform');
        if (platformParam) {
          setPlatform(platformParam);
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
          <Link href={getProductsHref()} style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            مجموعة روز
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
              المنتجات
            </Link>
            <Link href="/cart" className="cart-link" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={22} style={{ color: 'var(--text-secondary)' }} />
              {getTotalItems() > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
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
              Admin
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

