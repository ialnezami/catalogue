import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Trash2, Eye, EyeOff, LogOut, CheckCircle, Key, Edit, X } from 'lucide-react';

interface Platform {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: Date;
}

interface Admin {
  _id?: string;
  username: string;
  platform: string;
  active: boolean;
  createdAt?: Date;
}

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showChangeCredentialsModal, setShowChangeCredentialsModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPlatform, setNewPlatform] = useState({ name: '', description: '' });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.isSuperAdmin === true);
      if (data.isSuperAdmin) {
        loadPlatforms();
        loadAdmins();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/platforms/admins');
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const createPlatform = async () => {
    if (!newPlatform.name || !newPlatform.name.trim()) {
      alert('Platform name is required');
      return;
    }

    const code = newPlatform.name.toLowerCase().replace(/\s+/g, '');
    
    try {
      const response = await fetch('/api/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlatform.name,
          code: code,
          description: newPlatform.description,
        }),
      });

      if (response.ok) {
        await loadPlatforms();
        setShowCreateModal(false);
        setNewPlatform({ name: '', description: '' });
        alert('Platform created successfully!');
      } else {
        alert('Failed to create platform');
      }
    } catch (error) {
      console.error('Error creating platform:', error);
      alert('Failed to create platform');
    }
  };

  const createPlatformAdmin = async (platform: string) => {
    try {
      const response = await fetch('/api/platforms/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          platform: platform,
          password: `admin${platform}platform`,
        }),
      });

      if (response.ok) {
        await loadAdmins();
        alert(`Admin created for platform: ${platform}`);
        showCredentials(platform);
      } else {
        alert('Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin');
    }
  };

  const showCredentials = (platform: string) => {
    const foundPlatform = platforms.find(p => p.code === platform);
    if (foundPlatform) {
      setSelectedPlatform(foundPlatform);
      setShowCredentialsModal(true);
    }
  };

  const changeCredentials = (platform: string) => {
    const foundPlatform = platforms.find(p => p.code === platform);
    if (foundPlatform) {
      setSelectedPlatform(foundPlatform);
      setShowChangeCredentialsModal(true);
      setNewPassword(`admin${platform}platform`);
    }
  };

  const updateCredentials = async () => {
    if (!selectedPlatform || !newPassword.trim()) {
      alert('New password is required');
      return;
    }

    try {
      const response = await fetch('/api/platforms/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.code,
          password: newPassword,
        }),
      });

      if (response.ok) {
        await loadAdmins();
        setShowChangeCredentialsModal(false);
        setNewPassword('');
        alert('Credentials updated successfully!');
      } else {
        alert('Failed to update credentials');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      alert('Failed to update credentials');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ffffff' }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#ffffff' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Access Denied</h1>
          <p>Super Admin access required</p>
          <button
            onClick={() => router.push('/login')}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ec4899',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', color: '#ec4899', marginBottom: '0.5rem' }}>Super Admin Panel</h1>
            <p style={{ color: '#9ca3af' }}>Manage platforms and their admins</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {/* Create Platform Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#ec4899',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: 'bold',
            }}
          >
            <Plus size={24} />
            Create New Platform
          </button>
        </div>

        {/* Platforms List */}
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          {platforms.map((platform) => {
            const platformAdmin = admins.find(a => a.platform === platform.code);
            return (
              <div
                key={platform._id || platform.code}
                style={{
                  backgroundColor: '#1a1a1a',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem' }}>{platform.name}</h3>
                    <p style={{ color: '#9ca3af' }}>Code: {platform.code}</p>
                    {platform.description && <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>{platform.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!platformAdmin ? (
                      <button
                        onClick={() => createPlatformAdmin(platform.code)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <CheckCircle size={18} />
                        Create Admin
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => showCredentials(platform.code)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Eye size={18} />
                          Show Credentials
                        </button>
                        <button
                          onClick={() => changeCredentials(platform.code)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#f59e0b',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Key size={18} />
                          Change Password
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {platformAdmin && (
                  <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px', marginTop: '1rem' }}>
                    <p style={{ color: '#10b981', fontWeight: 'bold' }}>Admin Created ✓</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Username: admin • Platform: {platform.code}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Show Credentials Modal */}
        {showCredentialsModal && selectedPlatform && (
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
            onClick={() => setShowCredentialsModal(false)}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>Platform Credentials</h2>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.5rem',
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <p style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.125rem' }}>✓ Admin Created</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#9ca3af' }}>Platform Name:</span>
                    <span style={{ color: '#ffffff', marginLeft: '0.5rem', fontWeight: 'bold' }}>{selectedPlatform.name}</span>
                  </div>
                  <div>
                    <span style={{ color: '#9ca3af' }}>Platform Code:</span>
                    <span style={{ color: '#ffffff', marginLeft: '0.5rem', fontWeight: 'bold' }}>{selectedPlatform.code}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>Username:</span>
                    <p style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.5rem' }}>admin</p>
                  </div>
                  <div>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>Password:</span>
                    <p style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                      admin{selectedPlatform.code}platform
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCredentialsModal(false)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Change Credentials Modal */}
        {showChangeCredentialsModal && selectedPlatform && (
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
            onClick={() => setShowChangeCredentialsModal(false)}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>Change Credentials</h2>
                <button
                  onClick={() => setShowChangeCredentialsModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.5rem',
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Platform: <strong style={{ color: '#ffffff' }}>{selectedPlatform.name} ({selectedPlatform.code})</strong></p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Username</label>
                <input
                  type="text"
                  value="admin"
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#666',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>New Password *</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowChangeCredentialsModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={updateCredentials}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Platform Modal */}
        {showCreateModal && (
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
            onClick={() => setShowCreateModal(false)}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem' }}>Create New Platform</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Platform Name *</label>
                <input
                  type="text"
                  value={newPlatform.name}
                  onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                  placeholder="e.g., Roze"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                />
                {newPlatform.name && (
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Code will be: {newPlatform.name.toLowerCase().replace(/\s+/g, '')}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  value={newPlatform.description}
                  onChange={(e) => setNewPlatform({ ...newPlatform, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createPlatform}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

