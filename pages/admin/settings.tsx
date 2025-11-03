import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Save, DollarSign, Settings, Key, X } from 'lucide-react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    currency: 'USD',
    exchangeRate: 1,
    displayCurrency: 'SP',
    language: 'ar',
    heroTitle: 'اكتشفي مجموعتنا',
    heroSubtitle: 'قطع أنيقة للمرأة العصرية',
    heroTitleEn: 'Discover Our Collection',
    heroSubtitleEn: 'Elegant pieces for the modern woman',
  });

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Get platform from admin session
    const loadAdminPlatform = async () => {
      try {
        const authResponse = await fetch('/api/auth/check');
        const authData = await authResponse.json();
        
        const currentPlatform = authData.adminPlatform || new URLSearchParams(window.location.search).get('platform') || 'default';
        
        if (authData.adminPlatform) {
          setPlatform(authData.adminPlatform);
        } else {
          // Fallback to URL parameter or default
          const urlParams = new URLSearchParams(window.location.search);
          const platformParam = urlParams.get('platform') || 'default';
          setPlatform(platformParam);
        }

        // Load admin username for password change
        try {
          const adminsResponse = await fetch('/api/platforms/admins');
          const adminsData = await adminsResponse.json();
          const admin = adminsData.find((a: any) => a.platform === currentPlatform && a.active);
          if (admin) {
            setAdminUsername(admin.username);
          }
        } catch (error) {
          console.error('Error loading admin username:', error);
        }
      } catch (error) {
        console.error('Error fetching admin platform:', error);
        const urlParams = new URLSearchParams(window.location.search);
        const platformParam = urlParams.get('platform') || 'default';
        setPlatform(platformParam);
      }
    };
    
    loadAdminPlatform();
  }, []);

  useEffect(() => {
    if (platform) {
      loadSettings();
    }
  }, [platform]);

  const loadSettings = async () => {
    try {
      // Pass platform as query parameter to ensure correct platform settings
      const platformParam = platform ? `?platform=${platform}` : '';
      const response = await fetch(`/api/settings${platformParam}`);
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
      const platformParam = platform ? `?platform=${platform}` : '';
      const response = await fetch(`/api/settings${platformParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved successfully!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#10b981',
          },
        });
      } else {
        toast.error('Error saving settings!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (!adminUsername) {
      toast.error('Admin username not found');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully!');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing password');
    } finally {
      setChangingPassword(false);
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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Key size={18} />
              Change Password
            </button>
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

            <div style={{ marginBottom: '1.5rem' }}>
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

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                color: '#333333', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '600' 
              }}>
                Platform Language
              </label>
              <select
                className="input"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <option value="ar">العربية (Arabic)</option>
                <option value="en">English</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                This will set the language for the product creation modal and other admin interfaces
              </p>
            </div>

            <div style={{ 
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Settings size={24} color="#ec4899" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#000000' }}>
                  Homepage Hero Text
                </h2>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#333333', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Hero Title (Arabic)
                </label>
                <input
                  className="input"
                  type="text"
                  value={settings.heroTitle}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  placeholder="اكتشفي مجموعتنا"
                  style={{ direction: 'rtl' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                  Main heading displayed on homepage for Arabic language
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
                  Hero Subtitle (Arabic)
                </label>
                <input
                  className="input"
                  type="text"
                  value={settings.heroSubtitle}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  placeholder="قطع أنيقة للمرأة العصرية"
                  style={{ direction: 'rtl' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                  Subtitle displayed below the main heading for Arabic language
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
                  Hero Title (English)
                </label>
                <input
                  className="input"
                  type="text"
                  value={settings.heroTitleEn}
                  onChange={(e) => setSettings({ ...settings, heroTitleEn: e.target.value })}
                  placeholder="Discover Our Collection"
                />
                <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                  Main heading displayed on homepage for English language
                </p>
              </div>

              <div style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#333333', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Hero Subtitle (English)
                </label>
                <input
                  className="input"
                  type="text"
                  value={settings.heroSubtitleEn}
                  onChange={(e) => setSettings({ ...settings, heroSubtitleEn: e.target.value })}
                  placeholder="Elegant pieces for the modern woman"
                />
                <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                  Subtitle displayed below the main heading for English language
                </p>
              </div>
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

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowPasswordModal(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                width: '90%',
                maxWidth: '500px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#000000', margin: 0 }}>Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#666666',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '0.25rem',
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.5rem', fontWeight: '600' }}>Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.5rem', fontWeight: '600' }}>New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.5rem', fontWeight: '600' }}>Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    border: '1px solid #000000',
                    borderRadius: '0',
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
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    opacity: changingPassword ? 0.5 : 1,
                    cursor: changingPassword ? 'not-allowed' : 'pointer',
                  }}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

