import { ReactNode } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { getTotalItems } = useCart();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      <header
        style={{
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
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
          <Link href="/" style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>
            مجموعة روز
          </Link>
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link
              href="/"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              المنتجات
            </Link>
            <Link href="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={20} style={{ color: 'var(--text-secondary)' }} />
              {getTotalItems() > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
            </Link>
            <Link
              href="/pos"
              style={{
                color: 'var(--text-tertiary)',
                fontSize: '0.8125rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--success)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              POS
            </Link>
            <Link
              href="/admin/products"
              style={{
                color: 'var(--text-tertiary)',
                fontSize: '0.8125rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: 'rgba(236, 72, 153, 0.05)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}

