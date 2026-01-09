import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Save, DollarSign, Settings, Key, X, Upload, Store } from 'lucide-react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useLanguage } from '@/contexts/LanguageContext';

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
    shopLogo: '',
  });

  // Shop logo upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const router = useRouter();
  const { t, language } = useLanguage();

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
      if (data.shopLogo) {
        setLogoPreview(data.shopLogo);
      }
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
        body: JSON.stringify({
          ...settings,
          shopLogo: settings.shopLogo || '',
        }),
      });

      if (response.ok) {
        toast.success(t('admin.settingsSaved'), {
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
        toast.error(t('admin.settingsError'), {
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
      toast.error(t('admin.settingsError'), {
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('admin.invalidImageFile') || 'Please select a valid image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('admin.imageSizeTooLarge') || 'Image size must be less than 10MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Cloudinary via API (shop-logos folder)
      const response = await fetch('/api/upload?folder=shop-logos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Set the Cloudinary URL in the settings
      setSettings((prev) => ({ ...prev, shopLogo: data.url }));
      setLogoPreview(data.url);
      toast.success(t('admin.logoUploadedSuccess') || 'Logo uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : (t('admin.uploadFailed') || 'Failed to upload logo'));
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('admin.allFieldsRequired'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('admin.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('admin.passwordsDoNotMatch'));
      return;
    }

    if (!adminUsername) {
      toast.error(t('admin.adminUsernameNotFound'));
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
        toast.success(t('admin.passwordChangedSuccess'));
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || t('admin.passwordChangeError'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(t('admin.errorChangingPassword'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: '#9ca3af' }}>{t('admin.loadingSettings')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1 style={{ fontSize: '2.5rem', color: '#ec4899' }}>{t('admin.settings')}</h1>
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
              {t('admin.changePassword')}
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
              {t('admin.backToProducts')}
            </button>
          </div>
        </div>

        {/* Shop Information Section */}
        <div style={{ 
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Store size={24} color="#ec4899" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#000000' }}>
              {t('admin.shopInformation') || 'Shop Information'}
            </h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '1.5rem' }}>
            {t('admin.updateShopDetails') || 'Update your shop details and branding'}
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#333333', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem', 
              fontWeight: '600' 
            }}>
              {t('admin.shopLogo') || 'Shop Logo'}
            </label>
            
            {/* Logo Preview */}
            {(logoPreview || settings.shopLogo) && (
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={logoPreview || settings.shopLogo}
                  alt="Shop Logo Preview"
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    height: '200px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    padding: '0.5rem',
                  }}
                />
              </div>
            )}

            {/* File Upload Input (Hidden) */}
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoUpload}
              disabled={isUploadingLogo}
            />

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => logoFileInputRef.current?.click()}
              disabled={isUploadingLogo}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isUploadingLogo ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isUploadingLogo ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                opacity: isUploadingLogo ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isUploadingLogo) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploadingLogo) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }
              }}
            >
              {isUploadingLogo ? (
                <>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  {t('admin.uploadingLogo') || 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {t('admin.uploadLogo') || 'Upload Logo'}
                </>
              )}
            </button>

            {/* Or Divider */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <span style={{ padding: '0 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            {/* Manual URL Input */}
            <input
              type="text"
              value={settings.shopLogo}
              onChange={(e) => {
                setSettings({ ...settings, shopLogo: e.target.value });
                setLogoPreview(e.target.value || null);
              }}
              placeholder={t('admin.enterLogoUrl') || 'Enter logo URL (e.g., https://example.com/logo.png)'}
              className="input"
              style={{ marginBottom: '0.5rem' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
              {t('admin.uploadLogoOrUrl') || '💡 Upload a logo or paste a URL. Cloudinary upload automatically optimizes your images.'}
            </p>
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
              {t('admin.currencyConfiguration')}
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
                {t('admin.baseCurrency')}
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
                {t('admin.productsStoredInUSD')}
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
                {t('admin.exchangeRate')}
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
                {t('admin.updateExchangeRate')}
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
                {t('admin.displayCurrency')}
              </label>
              <select
                className="input"
                value={settings.displayCurrency}
                onChange={(e) => setSettings({ ...settings, displayCurrency: e.target.value })}
              >
                <option value="SP">{t('admin.syrianPound')}</option>
                <option value="USD">{t('admin.usDollar')}</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                {t('admin.pricesShownToCustomers')}
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
                {t('admin.platformLanguage')}
              </label>
              <select
                className="input"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <option value="ar">{t('admin.arabic')} (Arabic)</option>
                <option value="en">{t('admin.english')}</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                {t('admin.setLanguageForModal')}
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
                  {t('admin.homepageHeroText')}
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
                  {t('admin.heroTitleAr')}
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
                  {t('admin.mainHeadingArabic')}
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
                  {t('admin.heroSubtitleAr')}
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
                  {t('admin.subtitleBelowHeadingArabic')}
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
                  {t('admin.heroTitleEn')}
                </label>
                <input
                  className="input"
                  type="text"
                  value={settings.heroTitleEn}
                  onChange={(e) => setSettings({ ...settings, heroTitleEn: e.target.value })}
                  placeholder="Discover Our Collection"
                />
                <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                  {t('admin.mainHeadingEnglish')}
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
                  {t('admin.heroSubtitleEn')}
                </label>
                <input
                  className="input"
                  type="text"
                  value={settings.heroSubtitleEn}
                  onChange={(e) => setSettings({ ...settings, heroSubtitleEn: e.target.value })}
                  placeholder="Elegant pieces for the modern woman"
                />
                <p style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                  {t('admin.subtitleBelowHeadingEnglish')}
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
                <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>{t('admin.example')}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000000' }}>
                  $100 USD
                </p>
              </div>
              <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                →
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>{t('admin.showsToCustomer')}</p>
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
                {t('admin.cancel')}
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
                <Save size={18} style={{ marginLeft: language === 'ar' ? 0 : '0.5rem', marginRight: language === 'ar' ? '0.5rem' : 0 }} />
                {saving ? t('admin.saving') : t('admin.saveSettings')}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <h2 style={{ fontSize: '1.5rem', color: '#000000', margin: 0 }}>{t('admin.changePassword')}</h2>
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

              <div style={{ marginBottom: '1.5rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.5rem', fontWeight: '600' }}>{t('admin.currentPassword')} *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('admin.enterCurrentPassword')}
                  className="input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.5rem', fontWeight: '600' }}>{t('admin.newPassword')} *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('admin.enterNewPassword')}
                  className="input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <label style={{ display: 'block', color: '#333333', marginBottom: '0.5rem', fontWeight: '600' }}>{t('admin.confirmNewPassword')} *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('admin.confirmPassword')}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
                  {t('admin.cancel')}
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
                  {changingPassword ? t('admin.saving') : t('admin.changePassword')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

