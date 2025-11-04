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
  Globe,
  Search,
  Grid,
  List
} from 'lucide-react';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Platform {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}

export default function LandingPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = useState(false);
  const platformsPerPage = 12;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
      setLoading(true);
      const response = await fetch('/api/platforms?active=true');
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((p: Platform) => p.code !== 'default' && p.active !== false);
        // Sort by name alphabetically
        filtered.sort((a: Platform, b: Platform) => a.name.localeCompare(b.name));
        setPlatforms(filtered);
        setFilteredPlatforms(filtered);
      }
    } catch (error) {
      console.error('Error loading platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter platforms based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlatforms(platforms);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = platforms.filter(
      (platform) =>
        platform.name.toLowerCase().includes(query) ||
        platform.code.toLowerCase().includes(query) ||
        (platform.description && platform.description.toLowerCase().includes(query))
    );
    setFilteredPlatforms(filtered);
    setCurrentPage(1);
  }, [searchQuery, platforms]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPlatforms.length / platformsPerPage);
  const startIndex = (currentPage - 1) * platformsPerPage;
  const endIndex = startIndex + platformsPerPage;
  const displayedPlatforms = filteredPlatforms.slice(startIndex, endIndex);

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
        toast.success('Login successful!', {
          duration: 2000,
        });
        // Small delay to show the success message before redirect
        setTimeout(() => {
        if (data.role === 'super_admin') {
          router.push('/super-admin');
        } else {
          router.push('/admin/products');
        }
        }, 500);
      } else {
        toast.error(data.message || 'Login failed', {
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error('Login failed. Please try again.', {
        duration: 3000,
      });
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
        toast.success('Platform request submitted successfully! We will review it and contact you soon.', {
          duration: 3000,
        });
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
        toast.error('Failed to submit request. Please try again.', {
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error('Failed to submit request. Please try again.', {
        duration: 3000,
      });
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
        toast.success('Message sent successfully!', {
          duration: 2000,
        });
        setShowContact(false);
        setContactData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.', {
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.', {
        duration: 3000,
      });
    }
  };

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #10b981',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #ef4444',
            },
          },
        }}
      />
      <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundSize: '200% 200%',
      animation: 'gradientShift 15s ease infinite',
      direction: language === 'ar' ? 'rtl' : 'ltr',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'drift 20s linear infinite',
        opacity: 0.3
      }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite'
        }} />
      
      {/* Hero Section */}
          <div style={{ 
        padding: '6rem 2rem 8rem',
        textAlign: 'center',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {/* Language Selector */}
          <div style={{ 
            position: 'absolute', 
            top: '2rem', 
            right: language === 'ar' ? '2rem' : 'auto', 
            left: language === 'en' ? '2rem' : 'auto', 
            zIndex: 10 
          }} data-language-selector>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                data-language-selector
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '0.625rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ffffff',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(20px)',
                  fontWeight: '500',
                  fontSize: '0.9375rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                }}
              >
                <Globe size={18} />
                <span>{language === 'ar' ? 'العربية' : 'English'}</span>
              </button>
              {showLanguageSelector && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.75rem)',
                  right: language === 'ar' ? 0 : 'auto',
                  left: language === 'en' ? 0 : 'auto',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                  minWidth: '160px',
                  animation: 'slideDown 0.3s ease-out',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <button
                    onClick={() => { setLanguage('ar'); setShowLanguageSelector(false); }}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      background: language === 'ar' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                      color: language === 'ar' ? '#ffffff' : '#1a1a1a',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'block',
                      direction: 'rtl',
                      fontWeight: language === 'ar' ? '600' : '400',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (language !== 'ar') {
                        e.currentTarget.style.background = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (language !== 'ar') {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => { setLanguage('en'); setShowLanguageSelector(false); }}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      background: language === 'en' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                      color: language === 'en' ? '#ffffff' : '#1a1a1a',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'block',
                      borderTop: '1px solid #e5e7eb',
                      fontWeight: language === 'en' ? '600' : '400',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (language !== 'en') {
                        e.currentTarget.style.background = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (language !== 'en') {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            animation: 'float 4s ease-in-out infinite',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            <ShoppingBag 
              size={80} 
              style={{ 
                filter: 'drop-shadow(0 10px 40px rgba(255,255,255,0.4))',
                position: 'relative',
                zIndex: 1
              }} 
            />
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
            fontWeight: '900', 
            marginBottom: '1.5rem',
            letterSpacing: '-0.03em',
            textShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
            direction: language === 'ar' ? 'rtl' : 'ltr',
            lineHeight: '1.1',
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'fadeInUp 0.8s ease-out'
          }}>
            {t('landing.multiPlatformCatalogue')}
          </h1>
          <p style={{ 
            fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', 
            marginBottom: '3rem',
            opacity: 0.95,
            lineHeight: '1.7',
            direction: language === 'ar' ? 'rtl' : 'ltr',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            animation: 'fadeInUp 0.8s ease-out 0.2s both'
          }}>
            {t('landing.tagline')}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1.25rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            animation: 'fadeInUp 0.8s ease-out 0.4s both'
          }}>
            <button
              onClick={() => { setShowLogin(true); setActiveTab('login'); }}
              style={{
                padding: '1.125rem 2.5rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                color: '#667eea',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.125rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)';
              }}
            >
              <LogIn size={22} style={{ strokeWidth: 2.5 }} />
              {t('landing.login')}
            </button>
            <button
              onClick={() => { setShowSignup(true); setActiveTab('signup'); }}
              style={{
                padding: '1.125rem 2.5rem',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '16px',
                fontSize: '1.125rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#667eea';
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
            >
              <UserPlus size={22} style={{ strokeWidth: 2.5 }} />
              {t('landing.requestPlatform')}
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '6rem 2rem',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.98) 0%, #ffffff 100%)',
        backdropFilter: 'blur(10px)',
        position: 'relative'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(to bottom, rgba(102, 126, 234, 0.05) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ 
              fontSize: 'clamp(2rem, 5vw, 3rem)', 
              fontWeight: '800',
              marginBottom: '1rem',
              color: '#1a1a1a',
              direction: language === 'ar' ? 'rtl' : 'ltr',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}>
              {t('landing.whyChoose')}
          </h2>
            <div style={{
              width: '80px',
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '2px',
              margin: '0 auto',
              marginTop: '1rem'
            }} />
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            {[
              { icon: Shield, titleKey: 'landing.secureIsolated', descKey: 'landing.secureIsolatedDesc', color: '#10b981' },
              { icon: Zap, titleKey: 'landing.fastReliable', descKey: 'landing.fastReliableDesc', color: '#f59e0b' },
              { icon: Store, titleKey: 'landing.easyManagement', descKey: 'landing.easyManagementDesc', color: '#667eea' },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: '2.5rem',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  borderRadius: '24px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(102, 126, 234, 0.08)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.15), 0 8px 24px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = feature.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.08)';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}08 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  border: `1px solid ${feature.color}20`,
                  transition: 'all 0.3s ease'
                }}>
                  <feature.icon size={32} style={{ color: feature.color }} strokeWidth={2} />
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  marginBottom: '0.75rem', 
                  color: '#1a1a1a', 
                  direction: language === 'ar' ? 'rtl' : 'ltr',
                  lineHeight: '1.3'
                }}>
                  {t(feature.titleKey)}
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  lineHeight: '1.7', 
                  direction: language === 'ar' ? 'rtl' : 'ltr',
                  fontSize: '1rem'
                }}>
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Existing Platforms Section */}
      <div style={{ 
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: 'radial-gradient(circle at 2px 2px, #667eea 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ 
              fontSize: 'clamp(2rem, 5vw, 3rem)', 
              fontWeight: '800',
              marginBottom: '1rem',
              color: '#1a1a1a',
              direction: language === 'ar' ? 'rtl' : 'ltr',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}>
              {t('landing.existingPlatforms')}
          </h2>
            <div style={{
              width: '80px',
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '2px',
              margin: '0 auto',
              marginTop: '1rem'
            }} />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('landing.loadingPlatforms')}</p>
            </div>
          ) : platforms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('landing.noPlatformsYet')}</p>
            </div>
          ) : (
            <>
              {/* Search and View Controls */}
            <div style={{ 
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'stretch'
              }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Search Bar */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search 
                    size={20} 
                    style={{ 
                      position: 'absolute', 
                      left: language === 'ar' ? 'auto' : '1rem',
                      right: language === 'ar' ? '1rem' : 'auto',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      pointerEvents: 'none'
                    }} 
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('landing.searchPlatforms')}
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      paddingRight: language === 'ar' ? '3rem' : '1rem',
                      paddingLeft: language === 'ar' ? '1rem' : '3rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '14px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      transition: 'all 0.3s ease',
                      background: '#ffffff',
                      color: '#1a1a1a',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* View Mode Toggle */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  padding: '0.5rem',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: viewMode === 'grid' ? '#667eea' : 'transparent',
                      color: viewMode === 'grid' ? '#ffffff' : '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      fontWeight: viewMode === 'grid' ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'grid') {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'grid') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Grid size={18} />
                    {!isMobile && (
                      <span style={{ fontSize: '0.875rem' }}>{t('landing.gridView')}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: viewMode === 'list' ? '#667eea' : 'transparent',
                      color: viewMode === 'list' ? '#ffffff' : '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      fontWeight: viewMode === 'list' ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'list') {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'list') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <List size={18} />
                    {!isMobile && (
                      <span style={{ fontSize: '0.875rem' }}>{t('landing.listView')}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Count */}
              {filteredPlatforms.length > 0 && (
                <div style={{
                  marginBottom: '1.5rem',
                  color: '#6b7280',
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}>
                  <span>
                    {t('landing.showingPlatforms')} {startIndex + 1}-{Math.min(endIndex, filteredPlatforms.length)} {t('landing.of')} {filteredPlatforms.length} {t('landing.platforms')}
                    {searchQuery && ` (${filteredPlatforms.length} ${t('landing.platforms')})`}
                  </span>
                </div>
              )}

              {/* Platforms Grid/List */}
              {filteredPlatforms.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '4rem 2rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Search size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ 
                    color: '#1a1a1a', 
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    {t('landing.noPlatformsFound')}
                  </p>
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '0.9375rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    {t('landing.tryDifferentSearch')}
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: viewMode === 'grid' ? 'grid' : 'flex',
                  flexDirection: viewMode === 'list' ? 'column' : 'unset',
                  gridTemplateColumns: viewMode === 'grid' 
                    ? 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' 
                    : 'unset',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {displayedPlatforms.map((platform, idx) => (
                <Link 
                  key={platform._id || idx}
                  href={`/?platform=${platform.code}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: viewMode === 'list' ? '1.5rem 2rem' : '2.5rem',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      borderRadius: '24px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      display: viewMode === 'list' ? 'flex' : 'block',
                      alignItems: viewMode === 'list' ? 'center' : 'unset',
                      gap: viewMode === 'list' ? '2rem' : '0',
                      justifyContent: viewMode === 'list' ? 'space-between' : 'unset'
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode === 'grid') {
                        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      } else {
                        e.currentTarget.style.transform = language === 'ar' ? 'translateX(8px)' : 'translateX(-8px)';
                      }
                      e.currentTarget.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.2), 0 8px 24px rgba(0,0,0,0.12)';
                      e.currentTarget.style.borderColor = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.1)';
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '1.25rem',
                      flex: viewMode === 'list' ? 1 : 'unset',
                      marginBottom: viewMode === 'list' ? 0 : '1.25rem'
                    }}>
                      <div style={{
                        width: viewMode === 'list' ? '64px' : '56px',
                        height: viewMode === 'list' ? '64px' : '56px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #667eea15 0%, #764ba208 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(102, 126, 234, 0.15)',
                        flexShrink: 0
                      }}>
                        <Store size={viewMode === 'list' ? 32 : 28} style={{ color: '#667eea' }} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ 
                          fontSize: viewMode === 'list' ? '1.25rem' : '1.375rem', 
                          fontWeight: '700', 
                          color: '#1a1a1a', 
                          margin: '0 0 0.375rem 0',
                          lineHeight: '1.3'
                        }}>
                          {platform.name}
                        </h3>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#6b7280', 
                          margin: '0 0 0.5rem 0',
                          fontWeight: '500'
                        }}>
                          {platform.code}
                        </p>
                        {platform.description && viewMode === 'list' && (
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '0.9375rem', 
                            lineHeight: '1.6', 
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                        {platform.description}
                      </p>
                    )}
                        {platform.description && viewMode === 'grid' && (
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '0.9375rem', 
                            lineHeight: '1.7', 
                            marginTop: '1rem',
                            marginBottom: '1.5rem' 
                          }}>
                            {platform.description}
                          </p>
                        )}
                    </div>
                    </div>
                    {viewMode === 'list' && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        flexShrink: 0
                      }}>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          color: '#667eea', 
                          fontSize: '0.9375rem', 
                          fontWeight: '600',
                          direction: language === 'ar' ? 'rtl' : 'ltr',
                          padding: '0.75rem 1.25rem',
                          borderRadius: '12px',
                          background: 'rgba(102, 126, 234, 0.08)',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap'
                        }}>
                          {t('landing.visitPlatform')} 
                          <ArrowRight 
                            size={18} 
                            style={{ 
                              marginLeft: language === 'ar' ? 0 : '0.5rem', 
                              marginRight: language === 'ar' ? '0.5rem' : 0, 
                              transform: language === 'ar' ? 'scaleX(-1)' : 'none',
                              transition: 'transform 0.2s ease'
                            }} 
                          />
                        </div>
                      </div>
                    )}
                    {viewMode === 'grid' && (
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        color: '#667eea', 
                        fontSize: '0.9375rem', 
                        fontWeight: '600',
                        direction: language === 'ar' ? 'rtl' : 'ltr',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(102, 126, 234, 0.08)',
                        transition: 'all 0.2s ease'
                      }}>
                        {t('landing.visitPlatform')} 
                        <ArrowRight 
                          size={18} 
                          style={{ 
                            marginLeft: language === 'ar' ? 0 : '0.5rem', 
                            marginRight: language === 'ar' ? '0.5rem' : 0, 
                            transform: language === 'ar' ? 'scaleX(-1)' : 'none',
                            transition: 'transform 0.2s ease'
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '3rem',
                  flexWrap: 'wrap'
                }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                      color: currentPage === 1 ? '#9ca3af' : '#1a1a1a',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage > 1) {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.backgroundColor = '#f8f9ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage > 1) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    <ArrowRight 
                      size={18} 
                      style={{ 
                        transform: language === 'ar' ? 'scaleX(1)' : 'scaleX(-1)',
                        marginLeft: language === 'ar' ? '0.5rem' : '0',
                        marginRight: language === 'ar' ? '0' : '0.5rem'
                      }} 
                    />
                    {t('landing.previousPage')}
                  </button>

                  {/* Page Numbers */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            minWidth: '44px',
                            height: '44px',
                            padding: '0.5rem',
                            borderRadius: '12px',
                            border: '2px solid',
                            borderColor: currentPage === pageNum ? '#667eea' : '#e5e7eb',
                            backgroundColor: currentPage === pageNum ? '#667eea' : '#ffffff',
                            color: currentPage === pageNum ? '#ffffff' : '#1a1a1a',
                            cursor: 'pointer',
                            fontSize: '0.9375rem',
                            fontWeight: currentPage === pageNum ? '700' : '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage !== pageNum) {
                              e.currentTarget.style.borderColor = '#667eea';
                              e.currentTarget.style.backgroundColor = '#f8f9ff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentPage !== pageNum) {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            }
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                      color: currentPage === totalPages ? '#9ca3af' : '#1a1a1a',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage < totalPages) {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.backgroundColor = '#f8f9ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage < totalPages) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    {t('landing.nextPage')}
                    <ArrowRight 
                      size={18} 
                      style={{ 
                        transform: language === 'ar' ? 'scaleX(-1)' : 'scaleX(1)',
                        marginLeft: language === 'ar' ? '0' : '0.5rem',
                        marginRight: language === 'ar' ? '0.5rem' : '0'
                      }} 
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div style={{ 
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba208 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            border: '1px solid rgba(102, 126, 234, 0.15)'
          }}>
            <Mail size={40} style={{ color: '#667eea' }} strokeWidth={2} />
          </div>
          <h2 style={{ 
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
            fontWeight: '800', 
            marginBottom: '1rem', 
            color: '#1a1a1a', 
            direction: language === 'ar' ? 'rtl' : 'ltr',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {t('landing.needHelp')}
          </h2>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '2.5rem', 
            direction: language === 'ar' ? 'rtl' : 'ltr',
            fontSize: '1.125rem',
            lineHeight: '1.7'
          }}>
            {t('landing.haveQuestions')}
          </p>
          <button
            onClick={() => setShowContact(true)}
            style={{
              padding: '1.125rem 2.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              direction: language === 'ar' ? 'rtl' : 'ltr',
              boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3), 0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.4), 0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(102, 126, 234, 0.3), 0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <Mail size={22} style={{ strokeWidth: 2.5 }} />
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.625rem', 
                  color: '#1a1a1a', 
                  fontWeight: '600', 
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr' 
                }}>
                  {t('landing.username')}
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    transition: 'all 0.2s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.625rem', 
                  color: '#1a1a1a', 
                  fontWeight: '600', 
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr' 
                }}>
                  {t('landing.password')}
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    transition: 'all 0.2s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.0625rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  direction: language === 'ar' ? 'rtl' : 'ltr',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.625rem', 
                  color: '#1a1a1a', 
                  fontWeight: '600', 
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr' 
                }}>
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
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    transition: 'all 0.2s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.625rem', 
                  color: '#1a1a1a', 
                  fontWeight: '600', 
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr' 
                }}>
                  {t('landing.platformDescription')}
                </label>
                <textarea
                  value={signupData.platformDescription}
                  onChange={(e) => setSignupData({ ...signupData, platformDescription: e.target.value })}
                  placeholder="Brief description of your business"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    transition: 'all 0.2s ease',
                    background: '#fafafa',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.625rem', 
                    color: '#1a1a1a', 
                    fontWeight: '600', 
                    fontSize: '0.9375rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr' 
                  }}>
                    {t('landing.contactName')} *
                  </label>
                  <input
                    type="text"
                    value={signupData.contactName}
                    onChange={(e) => setSignupData({ ...signupData, contactName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      transition: 'all 0.2s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.625rem', 
                    color: '#1a1a1a', 
                    fontWeight: '600', 
                    fontSize: '0.9375rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr' 
                  }}>
                    {t('landing.businessType')}
                  </label>
                  <input
                    type="text"
                    value={signupData.businessType}
                    onChange={(e) => setSignupData({ ...signupData, businessType: e.target.value })}
                    placeholder="e.g., Fashion, Electronics"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      transition: 'all 0.2s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.625rem', 
                    color: '#1a1a1a', 
                    fontWeight: '600', 
                    fontSize: '0.9375rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr' 
                  }}>
                    {t('landing.email')} *
                  </label>
                  <input
                    type="email"
                    value={signupData.contactEmail}
                    onChange={(e) => setSignupData({ ...signupData, contactEmail: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      transition: 'all 0.2s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.625rem', 
                    color: '#1a1a1a', 
                    fontWeight: '600', 
                    fontSize: '0.9375rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr' 
                  }}>
                    {t('landing.phone')}
                  </label>
                  <input
                    type="tel"
                    value={signupData.contactPhone}
                    onChange={(e) => setSignupData({ ...signupData, contactPhone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      transition: 'all 0.2s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.625rem', 
                  color: '#1a1a1a', 
                  fontWeight: '600', 
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr' 
                }}>
                  {t('landing.additionalMessage')}
                </label>
                <textarea
                  value={signupData.message}
                  onChange={(e) => setSignupData({ ...signupData, message: e.target.value })}
                  placeholder={t('landing.tellUsMore')}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    transition: 'all 0.2s ease',
                    background: '#fafafa',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.0625rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  direction: language === 'ar' ? 'rtl' : 'ltr',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
                }}
              >
                <Send size={22} style={{ strokeWidth: 2.5 }} />
                {t('landing.submitRequest')}
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Contact Modal */}
      {showContact && (
        <Modal onClose={() => setShowContact(false)}>
          <div style={{ 
            width: '100%', 
            maxWidth: '800px',
            padding: '0 1rem'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '2.5rem',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              <h2 style={{ 
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
                fontWeight: '700', 
                marginBottom: '0.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                {t('landing.contactUsTitle')}
            </h2>
              <p style={{
                color: '#6b7280',
                fontSize: '1rem',
                marginTop: '0.5rem'
              }}>
                {language === 'ar' 
                  ? 'نحن هنا للمساعدة! املأ النموذج أدناه وسنعود إليك قريباً.' 
                  : 'We\'re here to help! Fill out the form below and we\'ll get back to you soon.'}
              </p>
            </div>
            <form onSubmit={handleContact}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: '#1a1a1a', 
                    fontWeight: '600', 
                    fontSize: '0.9375rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    {t('landing.name')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  required
                    placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  style={{
                    width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '14px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: '#fafafa',
                      color: '#1a1a1a',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                  }}
                />
              </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: '#1a1a1a', 
                    fontWeight: '600', 
                    fontSize: '0.9375rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    {t('landing.email')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  required
                    placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                  style={{
                    width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '14px',
                      fontSize: '1rem',
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: '#fafafa',
                      color: '#1a1a1a',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                  }}
                />
              </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: '#1a1a1a', 
                  fontWeight: '600', 
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}>
                  {t('landing.subject')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={contactData.subject}
                  onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                  required
                  placeholder={language === 'ar' ? 'ما هو موضوع استفسارك؟' : 'What is your inquiry about?'}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: '#fafafa',
                    color: '#1a1a1a',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: '#1a1a1a', 
                  fontWeight: '600', 
                  fontSize: '0.9375rem',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}>
                  {t('landing.message')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={contactData.message}
                  onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                  required
                  rows={6}
                  placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    minHeight: '140px',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: '#fafafa',
                    color: '#1a1a1a',
                    fontFamily: 'inherit',
                    lineHeight: '1.6'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1.125rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '1.0625rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  direction: language === 'ar' ? 'rtl' : 'ltr',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.35)';
                }}
              >
                <Send size={22} style={{ strokeWidth: 2.5 }} />
                {t('landing.sendMessage')}
              </button>
            </form>
          </div>
        </Modal>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 25px 80px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.2)',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(0, 0, 0, 0.04)',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '0.625rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '40px',
            height: '40px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#1a1a1a';
            e.currentTarget.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.transform = 'rotate(0deg)';
          }}
        >
          <X size={20} />
        </button>
        {children}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

