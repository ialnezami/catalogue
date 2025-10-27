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
          backgroundColor: '#1a1a1a',
          padding: '1rem 2rem',
          borderBottom: '2px solid #ec4899',
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
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
            مجموعة روز
          </Link>
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link
              href="/"
              style={{
                color: '#ffffff',
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ec4899';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              المنتجات
            </Link>
            <Link href="/cart" style={{ position: 'relative' }}>
              <ShoppingBag size={24} color="#ec4899" />
              {getTotalItems() > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
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

