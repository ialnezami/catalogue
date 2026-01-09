import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Plus, Trash2, Eye, EyeOff, LogOut, CheckCircle, Key, Edit, X, Clock, Check, XCircle, Mail, Phone, Building, Upload, Users, Globe, Shield, TrendingUp, Settings, Activity } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

interface Platform {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  language?: string;
  logo?: string;
  active?: boolean;
  createdAt?: Date;
}

interface Admin {
  _id?: string;
  username: string;
  platform: string;
  active: boolean;
  createdAt?: Date;
}

interface PlatformRequest {
  _id?: string;
  platformName: string;
  platformDescription?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  businessType?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  approvedAt?: Date;
  platformCode?: string;
}

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [platformRequests, setPlatformRequests] = useState<PlatformRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showChangeCredentialsModal, setShowChangeCredentialsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PlatformRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [newPassword, setNewPassword] = useState('');
  const [newPlatform, setNewPlatform] = useState({ name: '', description: '', logo: '', language: 'ar' });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Super admin password change states
  const [showSuperAdminPasswordModal, setShowSuperAdminPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newSuperAdminPassword, setNewSuperAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Delete admin states
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  
  // Delete/Deactivate platform states
  const [showDeletePlatformModal, setShowDeletePlatformModal] = useState(false);
  const [showDeactivatePlatformModal, setShowDeactivatePlatformModal] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<Platform | null>(null);
  const [platformToDeactivate, setPlatformToDeactivate] = useState<Platform | null>(null);
  const [deletingPlatform, setDeletingPlatform] = useState(false);
  const [deactivatingPlatform, setDeactivatingPlatform] = useState(false);

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
        loadPlatformRequests();
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

  const loadPlatformRequests = async () => {
    try {
      const status = requestFilter === 'all' ? '' : requestFilter;
      const url = status ? `/api/platforms/requests?status=${status}` : '/api/platforms/requests';
      const response = await fetch(url);
      const data = await response.json();
      setPlatformRequests(data);
    } catch (error) {
      console.error('Failed to load platform requests:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPlatformRequests();
    }
  }, [isAuthenticated, requestFilter]);

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/platforms/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          status: action === 'approve' ? 'approved' : 'rejected',
          action: action === 'approve' ? 'approve' : undefined,
        }),
      });

      if (response.ok) {
        toast.success(action === 'approve' ? 'Request approved and platform created!' : 'Request rejected');
        await loadPlatformRequests();
        await loadPlatforms();
        await loadAdmins();
        setShowRequestModal(false);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Cloudinary via API (platform logos folder)
      const response = await fetch('/api/upload?folder=platform-logos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Set the Cloudinary URL in the form
      setNewPlatform((prev) => ({ ...prev, logo: data.url }));
      setLogoPreview(data.url);
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };

  const createPlatform = async () => {
    if (!newPlatform.name || !newPlatform.name.trim()) {
      toast.error('Platform name is required');
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
          logo: newPlatform.logo || '',
          language: newPlatform.language || 'ar',
        }),
      });

      if (response.ok) {
        await loadPlatforms();
        setShowCreateModal(false);
        setNewPlatform({ name: '', description: '', logo: '', language: 'ar' });
        setLogoPreview(null);
        toast.success('Platform created successfully!');
      } else {
        toast.error('Failed to create platform');
      }
    } catch (error) {
      console.error('Error creating platform:', error);
      toast.error('Failed to create platform');
    }
  };

  const createPlatformAdmin = async (platform: string) => {
    // Generate unique username based on platform
    const username = `${platform}_admin`;
    
    try {
      const response = await fetch('/api/platforms/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          platform: platform,
          password: `admin${platform}platform`,
        }),
      });

      if (response.ok) {
        await loadAdmins();
        toast.success(`Admin created for platform: ${platform}`, {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        showCredentials(platform);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create admin. Username may already exist.', {
          duration: 4000,
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
      console.error('Error creating admin:', error);
      toast.error('Failed to create admin. Please try again.', {
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
    const platformAdmin = admins.find(a => a.platform === platform);
    
    if (foundPlatform) {
      setSelectedPlatform(foundPlatform);
      setShowChangeCredentialsModal(true);
      // Keep existing password field ready for new password
    }
  };

  const updateCredentials = async () => {
    if (!selectedPlatform || !newPassword.trim()) {
      toast.error('New password is required');
      return;
    }

    // Find the admin for this platform
    const platformAdmin = admins.find(a => a.platform === selectedPlatform.code);
    if (!platformAdmin) {
      toast.error('Admin not found for this platform');
      return;
    }

    try {
      const response = await fetch('/api/platforms/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: platformAdmin.username,
          password: newPassword,
        }),
      });

      if (response.ok) {
        await loadAdmins();
        setShowChangeCredentialsModal(false);
        setNewPassword('');
        toast.success('Password updated successfully!');
      } else {
        toast.error('Failed to update credentials');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast.error('Failed to update credentials');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleSuperAdminPasswordChange = async () => {
    if (!currentPassword || !newSuperAdminPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newSuperAdminPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newSuperAdminPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword: newSuperAdminPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully!');
        setShowSuperAdminPasswordModal(false);
        setCurrentPassword('');
        setNewSuperAdminPassword('');
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

  const handleDeleteAdminClick = (admin: Admin) => {
    setAdminToDelete(admin);
    setShowDeleteAdminModal(true);
  };

  const handleDeleteAdminConfirm = async () => {
    if (!adminToDelete) return;

    setDeletingAdmin(true);
    try {
      const response = await fetch(`/api/platforms/admins?username=${adminToDelete.username}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Admin deleted successfully!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        await loadAdmins();
        setShowDeleteAdminModal(false);
        setAdminToDelete(null);
      } else {
        toast.error(data.message || 'Failed to delete admin', {
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
      console.error('Error deleting admin:', error);
      toast.error('An error occurred while deleting admin', {
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
      setDeletingAdmin(false);
    }
  };

  const handleDeactivatePlatformClick = (platform: Platform) => {
    setPlatformToDeactivate(platform);
    setShowDeactivatePlatformModal(true);
  };

  const handleDeactivatePlatformConfirm = async () => {
    if (!platformToDeactivate) return;

    setDeactivatingPlatform(true);
    try {
      const response = await fetch('/api/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: platformToDeactivate.code,
          active: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Platform deactivated successfully!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        await loadPlatforms();
        setShowDeactivatePlatformModal(false);
        setPlatformToDeactivate(null);
      } else {
        toast.error(data.message || 'Failed to deactivate platform', {
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
      console.error('Error deactivating platform:', error);
      toast.error('An error occurred while deactivating platform', {
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
      setDeactivatingPlatform(false);
    }
  };

  const handleActivatePlatform = async (platform: Platform) => {
    try {
      const response = await fetch('/api/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: platform.code,
          active: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Platform activated successfully!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        await loadPlatforms();
      } else {
        toast.error(data.message || 'Failed to activate platform', {
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
      console.error('Error activating platform:', error);
      toast.error('An error occurred while activating platform', {
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
  };

  const handleDeletePlatformClick = (platform: Platform) => {
    setPlatformToDelete(platform);
    setShowDeletePlatformModal(true);
  };

  const handleDeletePlatformConfirm = async () => {
    if (!platformToDelete) return;

    setDeletingPlatform(true);
    try {
      const response = await fetch(`/api/platforms?code=${platformToDelete.code}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Platform deleted successfully!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        await loadPlatforms();
        await loadAdmins(); // Reload admins as they may have been deleted too
        setShowDeletePlatformModal(false);
        setPlatformToDelete(null);
      } else {
        toast.error(data.message || 'Failed to delete platform', {
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
      console.error('Error deleting platform:', error);
      toast.error('An error occurred while deleting platform', {
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
      setDeletingPlatform(false);
    }
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

  // Calculate statistics
  const activePlatforms = platforms.filter(p => p.active !== false).length;
  const deactivatedPlatforms = platforms.filter(p => p.active === false).length;
  const pendingRequests = platformRequests.filter(r => r.status === 'pending').length;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '2rem',
      paddingTop: '1.5rem',
    }}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #374151',
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Modern Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(236, 72, 153, 0.2)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
              }}>
                <Shield size={24} color="#ffffff" />
          </div>
              <div>
                <h1 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  Super Admin Panel
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Manage platforms, admins, and requests
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowSuperAdminPasswordModal(true)}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <Key size={18} />
              Change Password
            </button>
          <button
            onClick={handleLogout}
            style={{
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
                borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
            }}
          >
              <LogOut size={18} />
            Logout
          </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(236, 72, 153, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.4)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(236, 72, 153, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.2)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Globe size={24} color="#ffffff" />
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {platforms.length}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Total Platforms</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Activity size={24} color="#ffffff" />
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#10b981',
              }}>
                {activePlatforms}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Active Platforms</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={24} color="#ffffff" />
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#f59e0b',
              }}>
                {pendingRequests}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Pending Requests</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={24} color="#ffffff" />
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#3b82f6',
              }}>
                {admins.length}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Total Admins</p>
          </div>
        </div>

        {/* Create Platform Button */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(236, 72, 153, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)';
            }}
          >
            <Plus size={22} />
            Create New Platform
          </button>
        </div>

        {/* Platform Requests Section */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={20} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: '#ffffff', 
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}>
                  Platform Requests
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                  Review and manage platform requests
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRequestFilter(filter)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: requestFilter === filter 
                      ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                      : 'rgba(55, 65, 81, 0.8)',
                    color: '#ffffff',
                    border: requestFilter === filter ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontSize: '0.813rem',
                    fontWeight: requestFilter === filter ? '600' : '500',
                    transition: 'all 0.2s ease',
                    boxShadow: requestFilter === filter ? '0 2px 8px rgba(236, 72, 153, 0.3)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (requestFilter !== filter) {
                      e.currentTarget.style.background = 'rgba(55, 65, 81, 1)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (requestFilter !== filter) {
                      e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {platformRequests.length === 0 ? (
            <div style={{ 
              padding: '4rem 2rem', 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Clock size={32} color="#f59e0b" />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '1rem', margin: 0 }}>
                No {requestFilter === 'all' ? '' : requestFilter} requests found
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {platformRequests.map((request) => (
                <div
                  key={request._id}
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(236, 72, 153, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  }}
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowRequestModal(true);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
                          {request.platformName}
                        </h3>
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: request.status === 'approved' 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : request.status === 'rejected'
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#ffffff',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                        }}>
                          {request.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: '#9ca3af', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={14} />
                          {request.contactEmail}
                        </div>
                        {request.contactPhone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} />
                            {request.contactPhone}
                          </div>
                        )}
                        {request.businessType && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building size={14} />
                            {request.businessType}
                          </div>
                        )}
                        {request.createdAt && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={14} />
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestAction(request._id!, 'approve');
                          }}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                          }}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestAction(request._id!, 'reject');
                          }}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {request.platformDescription && (
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                      {request.platformDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platforms List */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Globe size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                color: '#ffffff', 
                margin: 0,
                letterSpacing: '-0.01em',
              }}>
                Platforms
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                Manage all platforms and their configurations
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
          {platforms.map((platform) => {
            const platformAdmin = admins.find(a => a.platform === platform.code);
            return (
              <div
                key={platform._id || platform.code}
                style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                    padding: '1.75rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(236, 72, 153, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.375rem', fontWeight: '600', color: '#ffffff', margin: 0 }}>{platform.name}</h3>
                      {platform.active === false && (
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: '#ffffff',
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                        }}>
                          Deactivated
                        </span>
                      )}
                      {platform.active !== false && (
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                        }}>
                          Active
                        </span>
                      )}
                  </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                        <span style={{ color: '#6b7280' }}>Code:</span> <span style={{ color: '#ffffff', fontWeight: '500' }}>{platform.code}</span>
                      </p>
                      {platform.language && (
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                          <span style={{ color: '#6b7280' }}>Language:</span> <span style={{ color: '#ffffff', fontWeight: '500' }}>{platform.language.toUpperCase()}</span>
                        </p>
                      )}
                    </div>
                    {platform.description && (
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                        {platform.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {platform.active === false ? (
                      <button
                        onClick={() => handleActivatePlatform(platform)}
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
                        Activate Platform
                      </button>
                    ) : (
                      <>
                        {!platformAdmin ? (
                      <button
                        onClick={() => createPlatformAdmin(platform.code)}
                        style={{
                          padding: '0.625rem 1.25rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
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
                            padding: '0.625rem 1.25rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                          }}
                        >
                          <Eye size={18} />
                          Show Credentials
                        </button>
                        <button
                          onClick={() => changeCredentials(platform.code)}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                          }}
                        >
                          <Key size={18} />
                          Change Password
                        </button>
                        <button
                          onClick={() => handleDeleteAdminClick(platformAdmin)}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          <Trash2 size={18} />
                          Delete Admin
                        </button>
                      </>
                    )}
                        <button
                          onClick={() => handleDeactivatePlatformClick(platform)}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                          }}
                        >
                          <EyeOff size={18} />
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleDeletePlatformClick(platform)}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          <Trash2 size={18} />
                          Delete Platform
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {platformAdmin && (
                  <div style={{ 
                    padding: '1rem', 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    borderRadius: '12px', 
                    marginTop: '1rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CheckCircle size={18} color="#10b981" />
                      <p style={{ color: '#10b981', fontWeight: '600', fontSize: '0.875rem', margin: 0 }}>
                        Admin Created
                      </p>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '0.813rem', margin: 0, lineHeight: '1.5' }}>
                      <span style={{ color: '#6b7280' }}>Username:</span> <span style={{ color: '#ffffff', fontWeight: '500' }}>{platformAdmin.username}</span>
                      {' • '}
                      <span style={{ color: '#6b7280' }}>Platform:</span> <span style={{ color: '#ffffff', fontWeight: '500' }}>{platform.code}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
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
                    <p style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                      {admins.find(a => a.platform === selectedPlatform.code)?.username || `${selectedPlatform.code}_admin`}
                    </p>
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
                  value={admins.find(a => a.platform === selectedPlatform.code)?.username || `${selectedPlatform.code}_admin`}
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

        {/* Request Detail Modal */}
        {showRequestModal && selectedRequest && (
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
              padding: '2rem',
            }}
            onClick={() => setShowRequestModal(false)}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>Platform Request Details</h2>
                <button
                  onClick={() => setShowRequestModal(false)}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Platform Name</label>
                  <p style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: '600', marginTop: '0.25rem' }}>
                    {selectedRequest.platformName}
                  </p>
                </div>

                {selectedRequest.platformDescription && (
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Description</label>
                    <p style={{ color: '#ffffff', marginTop: '0.25rem', lineHeight: '1.6' }}>
                      {selectedRequest.platformDescription}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Contact Name</label>
                    <p style={{ color: '#ffffff', marginTop: '0.25rem' }}>{selectedRequest.contactName}</p>
                  </div>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Email</label>
                    <p style={{ color: '#ffffff', marginTop: '0.25rem' }}>{selectedRequest.contactEmail}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {selectedRequest.contactPhone && (
                    <div>
                      <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Phone</label>
                      <p style={{ color: '#ffffff', marginTop: '0.25rem' }}>{selectedRequest.contactPhone}</p>
                    </div>
                  )}
                  {selectedRequest.businessType && (
                    <div>
                      <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Business Type</label>
                      <p style={{ color: '#ffffff', marginTop: '0.25rem' }}>{selectedRequest.businessType}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.message && (
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Additional Message</label>
                    <p style={{ color: '#ffffff', marginTop: '0.25rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {selectedRequest.message}
                    </p>
                  </div>
                )}

                <div>
                  <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Status</label>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    backgroundColor: 
                      selectedRequest.status === 'approved' ? '#10b981' :
                      selectedRequest.status === 'rejected' ? '#ef4444' :
                      '#f59e0b',
                    color: '#ffffff',
                    marginTop: '0.25rem'
                  }}>
                    {selectedRequest.status}
                  </span>
                </div>

                {selectedRequest.createdAt && (
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Request Date</label>
                    <p style={{ color: '#ffffff', marginTop: '0.25rem' }}>
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedRequest.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #374151' }}>
                    <button
                      onClick={() => handleRequestAction(selectedRequest._id!, 'approve')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: '600'
                      }}
                    >
                      <Check size={20} />
                      Approve & Create Platform
                    </button>
                    <button
                      onClick={() => handleRequestAction(selectedRequest._id!, 'reject')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: '600'
                      }}
                    >
                      <XCircle size={20} />
                      Reject
                    </button>
                  </div>
                )}
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
            onClick={() => {
              setShowCreateModal(false);
              setLogoPreview(null);
            }}
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
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  Platform Logo
                </label>
                
                {/* Logo Preview */}
                {(logoPreview || newPlatform.logo) && (
                  <div style={{ marginBottom: '1rem' }}>
                    <img
                      src={logoPreview || newPlatform.logo}
                      alt="Logo Preview"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: '200px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #374151',
                        backgroundColor: '#1a1a1a',
                        padding: '0.5rem',
                      }}
                    />
                  </div>
                )}

                {/* File Upload Button */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: isUploadingLogo ? '#374151' : '#3b82f6',
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
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload Logo to Cloudinary
                      </>
                    )}
                  </button>
                </div>

                {/* Or Divider */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }}></div>
                  <span style={{ padding: '0 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }}></div>
                </div>

                {/* Manual URL Input */}
                <input
                  type="text"
                  value={newPlatform.logo}
                  onChange={(e) => {
                    setNewPlatform({ ...newPlatform, logo: e.target.value });
                    setLogoPreview(e.target.value || null);
                  }}
                  placeholder="Enter logo URL (e.g., https://example.com/logo.png or /images/logo.png)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                />
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  💡 Upload a logo or paste a URL. Cloudinary upload automatically optimizes your images.
                </p>
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
                  onClick={() => {
              setShowCreateModal(false);
              setLogoPreview(null);
            }}
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

        {/* Super Admin Password Change Modal */}
        {showSuperAdminPasswordModal && (
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
            onClick={() => setShowSuperAdminPasswordModal(false)}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                width: '90%',
                maxWidth: '500px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0 }}>Change Super Admin Password</h2>
                <button
                  onClick={() => setShowSuperAdminPasswordModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '0.25rem',
                  }}
                >
                  <X size={24} />
                </button>
      </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>New Password *</label>
                <input
                  type="password"
                  value={newSuperAdminPassword}
                  onChange={(e) => setNewSuperAdminPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
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
                  onClick={() => {
                    setShowSuperAdminPasswordModal(false);
                    setCurrentPassword('');
                    setNewSuperAdminPassword('');
                    setConfirmPassword('');
                  }}
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
                  onClick={handleSuperAdminPasswordChange}
                  disabled={changingPassword}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: changingPassword ? 'not-allowed' : 'pointer',
                    opacity: changingPassword ? 0.5 : 1,
                    fontWeight: 'bold',
                  }}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Delete Admin Confirmation Modal */}
      <ConfirmationModal
          isOpen={showDeleteAdminModal}
          onClose={() => {
            setShowDeleteAdminModal(false);
            setAdminToDelete(null);
          }}
          onConfirm={handleDeleteAdminConfirm}
          title="Delete Admin"
          message={adminToDelete ? `Are you sure you want to delete the admin "${adminToDelete.username}" for platform "${adminToDelete.platform}"? This action cannot be undone and the admin will no longer be able to access their platform.` : ''}
          confirmText="Delete Admin"
          cancelText="Cancel"
          type="danger"
          isLoading={deletingAdmin}
      />

      {/* Deactivate Platform Confirmation Modal */}
      <ConfirmationModal
          isOpen={showDeactivatePlatformModal}
          onClose={() => {
            setShowDeactivatePlatformModal(false);
            setPlatformToDeactivate(null);
          }}
          onConfirm={handleDeactivatePlatformConfirm}
          title="Deactivate Platform"
          message={platformToDeactivate ? `Are you sure you want to deactivate the platform "${platformToDeactivate.name}" (${platformToDeactivate.code})? The platform will be hidden from public access but can be reactivated later.` : ''}
          confirmText="Deactivate Platform"
          cancelText="Cancel"
          type="warning"
          isLoading={deactivatingPlatform}
      />

      {/* Delete Platform Confirmation Modal */}
      <ConfirmationModal
          isOpen={showDeletePlatformModal}
          onClose={() => {
            setShowDeletePlatformModal(false);
            setPlatformToDelete(null);
          }}
          onConfirm={handleDeletePlatformConfirm}
          title="Delete Platform"
          message={platformToDelete ? `Are you sure you want to delete the platform "${platformToDelete.name}" (${platformToDelete.code})? This action cannot be undone. All associated data including products, orders, and admin accounts will be permanently deleted.` : ''}
          confirmText="Delete Platform"
          cancelText="Cancel"
          type="danger"
          isLoading={deletingPlatform}
      />
    </div>
  );
}

