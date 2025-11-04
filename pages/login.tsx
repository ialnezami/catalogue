import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LogIn, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth/check').catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get platform from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const platformParam = urlParams.get('platform');
      
      // Build login URL with platform param
      let loginUrl = '/api/auth/login';
      if (platformParam) {
        loginUrl += `?platform=${platformParam}`;
      }
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Clear error message
        setError('');
        
        // Show center modal
        setShowSuccessModal(true);
        
        // Show corner toast
        toast.success('Login successful!', {
          duration: 1500,
          position: 'top-right',
        });
        
        // Clear all toasts and redirect after showing both messages
        setTimeout(() => {
          toast.dismiss(); // Remove all message boxes
          setShowSuccessModal(false);
          // Redirect based on role
          if (data.role === 'super_admin') {
            router.push('/super-admin');
          } else {
            router.push('/admin/products');
          }
        }, 1500);
      } else {
        setError('Invalid credentials');
        toast.error('Invalid credentials', {
          duration: 3000,
        });
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      toast.error('Login failed. Please try again.', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '3rem',
          borderRadius: '12px',
          border: '1px solid #374151',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <LogIn size={48} color="#ec4899" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '2rem', color: '#ffffff', marginBottom: '0.5rem' }}>Admin Login</h1>
          <p style={{ color: '#9ca3af' }}>Super Admin or Platform Admin Access</p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '1rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#ec4899',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      {/* Success Modal (Center) */}
      {showSuccessModal && (
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
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '3rem',
              borderRadius: '16px',
              border: '2px solid #10b981',
              boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)',
              textAlign: 'center',
              maxWidth: '400px',
              animation: 'slideUp 0.3s ease',
            }}
          >
            <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              Login successful!
            </h2>
            <p style={{ color: '#9ca3af' }}>Redirecting...</p>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}

