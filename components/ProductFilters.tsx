import { Product } from '@/types';
import { Search, Filter } from 'lucide-react';

interface ProductFiltersProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
}

export default function ProductFilters({ products, onFilter }: ProductFiltersProps) {
  const handleSearch = (query: string) => {
    const filtered = products.filter(
      (product) =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
    );
    onFilter(filtered);
  };

  const handleCategoryFilter = (category: string) => {
    if (category === 'all') {
      onFilter(products);
      return;
    }
    const filtered = products.filter((product) => product.category === category);
    onFilter(filtered);
  };

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #374151',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: '1',
            minWidth: '250px',
            position: 'relative',
          }}
        >
          <Search
            size={20}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
            }}
          />
          <input
            type="text"
            placeholder="ابحث عن المنتجات..."
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 2.75rem 0.75rem 1rem',
              backgroundColor: '#0a0a0a',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.3s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={20} color="#ec4899" />
          <select
            onChange={(e) => handleCategoryFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#0a0a0a',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
            }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

