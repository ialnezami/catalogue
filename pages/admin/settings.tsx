import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Save, DollarSign, Settings } from 'lucide-react';
import { useRouter } from 'next/router';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    currency: 'USD',
    exchangeRate: 1,
    displayCurrency: 'SP',
  });

  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Error saving settings!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: '#9ca3af' }}>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1 style={{ fontSize: '2.5rem', color: '#ec4899' }}>Settings</h1>
          <button
            onClick={() => router.push('/admin/products')}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Back to Products
          </button>
        </div>

        <div style={{ 
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Settings size={24} color="#ec4899" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#000000' }}>
              Currency Configuration
            </h2>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                color: '#333333', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '600' 
              }}>
                Base Currency (for storage)
              </label>
              <input
                className="input"
                type="text"
                value={settings.currency}
                readOnly
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                Products are stored in USD
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                color: '#333333', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '600' 
              }}>
                Exchange Rate (1 USD = ? SP)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', color: '#666666' }}>1 USD =</span>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.exchangeRate}
                  onChange={(e) => setSettings({ ...settings, exchangeRate: parseFloat(e.target.value) || 1 })}
                  required
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '1rem', color: '#666666', fontWeight: '600' }}>SP</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                Update this rate to match current market exchange rate
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                color: '#333333', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '600' 
              }}>
                Display Currency (shown to customers)
              </label>
              <select
                className="input"
                value={settings.displayCurrency}
                onChange={(e) => setSettings({ ...settings, displayCurrency: e.target.value })}
              >
                <option value="SP">Syrian Pound (SP)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                Prices shown to customers will be converted to this currency
              </p>
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '12px',
            }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>Example:</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000000' }}>
                  $100 USD
                </p>
              </div>
              <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                →
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>Shows to customer:</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ec4899' }}>
                  {(100 * settings.exchangeRate).toLocaleString()} SP
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0',
                  border: '1px solid #000000',
                  background: 'transparent',
                  color: '#000000',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{
                  padding: '0.875rem 2rem',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                <Save size={18} style={{ marginLeft: '0.5rem' }} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

