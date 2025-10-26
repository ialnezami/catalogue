import { Product } from '@/types';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #374151',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#ec4899';
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(236, 72, 153, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#374151';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div
          style={{
            width: '100%',
            height: '250px',
            backgroundColor: '#2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `url(/images/${product.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {product.image && <img src={`/images/${product.image}`} alt={product.title} style={{ maxWidth: '100%', maxHeight: '100%' }} />}
        </div>
        <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#ec4899', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {product.category}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#ffffff' }}>
            {product.title}
          </h3>
          <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '1rem', flexGrow: 1 }}>
            {product.description}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
              ${product.price.toFixed(2)}
            </span>
            <button
              onClick={handleAddToCart}
              style={{
                backgroundColor: '#ec4899',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#db2777';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ec4899';
              }}
            >
              <ShoppingCart size={18} />
              Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

