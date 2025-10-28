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
      className="card"
      style={{
        padding: '1.25rem',
        marginBottom: '2rem',
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
            minWidth: '280px',
            position: 'relative',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            className="input"
            type="text"
            placeholder="ابحث عن المنتجات..."
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              padding: '0.75rem 2.5rem 0.75rem 1rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={18} style={{ color: 'var(--accent-primary)' }} />
          <select
            className="input"
            onChange={(e) => handleCategoryFilter(e.target.value)}
            style={{
              width: 'auto',
              minWidth: '180px',
              cursor: 'pointer',
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

