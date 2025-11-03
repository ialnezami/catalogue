import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Store, 
  LogIn, 
  UserPlus, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  X,
  Send,
  ShoppingBag,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Platform {
  _id?: string;
  name: string;
  code: string;
  description?: string;
}

export default function LandingPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // Set default language on mount (Arabic)
  useEffect(() => {
    const savedLang = typeof window !== 'undefined' ? localStorage.getItem('customerLanguage') : null;
    if (!savedLang && typeof window !== 'undefined') {
      setLanguage('ar');
      localStorage.setItem('customerLanguage', 'ar');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    }
  }, [setLanguage]);

  // Close language selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLanguageSelector && !target.closest('[data-language-selector]')) {
        setShowLanguageSelector(false);
      }
    };

    if (showLanguageSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageSelector]);
  
  // Login form
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // Signup/Platform request form
  const [signupData, setSignupData] = useState({
    platformName: '',
    platformDescription: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    businessType: '',
    message: ''
  });
  
  // Contact form
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.filter((p: Platform) => p.code !== 'default'));
      }
    } catch (error) {
      console.error('Error loading platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Login successful!');
        if (data.role === 'super_admin') {
          router.push('/super-admin');
        } else {
          router.push('/admin/products');
        }
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  const handlePlatformRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/platforms/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupData,
          status: 'pending',
          createdAt: new Date(),
        }),
      });

      if (response.ok) {
        toast.success('Platform request submitted successfully! We will review it and contact you soon.');
        setShowSignup(false);
        setSignupData({
          platformName: '',
          platformDescription: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          businessType: '',
          message: ''
        });
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      if (response.ok) {
        toast.success('Message sent successfully!');
        setShowContact(false);
        setContactData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '1rem',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Hero Section */}
      <div style={{ 
        padding: '4rem 2rem',
        textAlign: 'center',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-block',
            marginBottom: '1.5rem',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <ShoppingBag size={80} style={{ filter: 'drop-shadow(0 10px 30px rgba(255,255,255,0.3))' }} />
          </div>
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Language Selector */}
            <div style={{ position: 'absolute', top: 0, right: language === 'ar' ? 0 : 'auto', left: language === 'en' ? 0 : 'auto', zIndex: 10 }} data-language-selector>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                  data-language-selector
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#ffffff',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <Globe size={18} />
                  <span>{language === 'ar' ? 'العربية' : 'English'}</span>
                </button>
                {showLanguageSelector && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: language === 'ar' ? 0 : 'auto',
                    left: language === 'en' ? 0 : 'auto',
                    marginTop: '0.5rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    minWidth: '150px',
                  }}>
                    <button
                      onClick={() => { setLanguage('ar'); setShowLanguageSelector(false); }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: language === 'ar' ? '#667eea' : 'transparent',
                        color: language === 'ar' ? '#ffffff' : '#1a1a1a',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'block',
                        direction: 'rtl',
                      }}
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => { setLanguage('en'); setShowLanguageSelector(false); }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: language === 'en' ? '#667eea' : 'transparent',
                        color: language === 'en' ? '#ffffff' : '#1a1a1a',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'block',
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: '800', 
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}>
            {t('landing.multiPlatformCatalogue')}
          </h1>
          <p style={{ 
            fontSize: '1.5rem', 
            marginBottom: '2rem',
            opacity: 0.95,
            lineHeight: '1.6',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}>
            {t('landing.tagline')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setShowLogin(true); setActiveTab('login'); }}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#ffffff',
                color: '#667eea',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
              }}
            >
              <LogIn size={20} />
              {t('landing.login')}
            </button>
            <button
              onClick={() => { setShowSignup(true); setActiveTab('signup'); }}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '12px',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#667eea';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <UserPlus size={20} />
              {t('landing.requestPlatform')}
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '4rem 2rem',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            fontWeight: '700',
            marginBottom: '3rem',
            color: '#1a1a1a',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}>
            {t('landing.whyChoose')}
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}>
            {[
              { icon: Shield, titleKey: 'landing.secureIsolated', descKey: 'landing.secureIsolatedDesc' },
              { icon: Zap, titleKey: 'landing.fastReliable', descKey: 'landing.fastReliableDesc' },
              { icon: Store, titleKey: 'landing.easyManagement', descKey: 'landing.easyManagementDesc' },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: '2rem',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(102, 126, 234, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                }}
              >
                <feature.icon size={40} style={{ color: '#667eea', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1a1a1a', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t(feature.titleKey)}
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.6', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Existing Platforms Section */}
      <div style={{ 
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            fontWeight: '700',
            marginBottom: '3rem',
            color: '#1a1a1a',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}>
            {t('landing.existingPlatforms')}
          </h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('landing.loadingPlatforms')}</p>
            </div>
          ) : platforms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('landing.noPlatformsYet')}</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {platforms.map((platform, idx) => (
                <Link 
                  key={platform._id || idx}
                  href={`/?platform=${platform.code}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: '2rem',
                      background: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.3)';
                      e.currentTarget.style.borderColor = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <Store size={32} style={{ color: '#667eea' }} />
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                          {platform.name}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          {platform.code}
                        </p>
                      </div>
                    </div>
                    {platform.description && (
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                        {platform.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', color: '#667eea', fontSize: '0.875rem', fontWeight: '600', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                      {t('landing.visitPlatform')} <ArrowRight size={16} style={{ marginLeft: language === 'ar' ? 0 : '0.5rem', marginRight: language === 'ar' ? '0.5rem' : 0, transform: language === 'ar' ? 'scaleX(-1)' : 'none' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div style={{ 
        padding: '4rem 2rem',
        background: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Mail size={48} style={{ color: '#667eea', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', color: '#1a1a1a', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            {t('landing.needHelp')}
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            {t('landing.haveQuestions')}
          </p>
          <button
            onClick={() => setShowContact(true)}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5568d3';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Mail size={20} />
            {t('landing.contactUs')}
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <Modal onClose={() => setShowLogin(false)}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1a1a1a', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('landing.loginToPlatform')}
            </h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.username')}
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.password')}
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#667eea';
                }}
              >
                {t('landing.login')}
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Signup/Platform Request Modal */}
      {showSignup && (
        <Modal onClose={() => setShowSignup(false)}>
          <div style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1a1a1a', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('landing.requestNewPlatform')}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('landing.requestFormDescription')}
            </p>
            <form onSubmit={handlePlatformRequest}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.platformName')} *
                </label>
                <input
                  type="text"
                  value={signupData.platformName}
                  onChange={(e) => setSignupData({ ...signupData, platformName: e.target.value })}
                  required
                    placeholder="e.g., My Store"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}
                  />
                </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.platformDescription')}
                </label>
                <textarea
                  value={signupData.platformDescription}
                  onChange={(e) => setSignupData({ ...signupData, platformDescription: e.target.value })}
                  placeholder="Brief description of your business"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    {t('landing.contactName')} *
                  </label>
                  <input
                    type="text"
                    value={signupData.contactName}
                    onChange={(e) => setSignupData({ ...signupData, contactName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    {t('landing.businessType')}
                  </label>
                  <input
                    type="text"
                    value={signupData.businessType}
                    onChange={(e) => setSignupData({ ...signupData, businessType: e.target.value })}
                    placeholder="e.g., Fashion, Electronics"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    {t('landing.email')} *
                  </label>
                  <input
                    type="email"
                    value={signupData.contactEmail}
                    onChange={(e) => setSignupData({ ...signupData, contactEmail: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    {t('landing.phone')}
                  </label>
                  <input
                    type="tel"
                    value={signupData.contactPhone}
                    onChange={(e) => setSignupData({ ...signupData, contactPhone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.additionalMessage')}
                </label>
                <textarea
                  value={signupData.message}
                  onChange={(e) => setSignupData({ ...signupData, message: e.target.value })}
                  placeholder={t('landing.tellUsMore')}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#667eea';
                }}
              >
                <Send size={20} />
                {t('landing.submitRequest')}
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Contact Modal */}
      {showContact && (
        <Modal onClose={() => setShowContact(false)}>
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1a1a1a', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('landing.contactUsTitle')}
            </h2>
            <form onSubmit={handleContact}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.name')} *
                </label>
                <input
                  type="text"
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.email')} *
                </label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.subject')} *
                </label>
                <input
                  type="text"
                  value={contactData.subject}
                  onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  {t('landing.message')} *
                </label>
                <textarea
                  value={contactData.message}
                  onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                  required
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#667eea';
                }}
              >
                <Send size={20} />
                {t('landing.sendMessage')}
              </button>
            </form>
          </div>
        </Modal>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
    </>
  );
}

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ children, onClose }: ModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '100%',
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#1a1a1a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <X size={24} />
        </button>
        {children}
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

