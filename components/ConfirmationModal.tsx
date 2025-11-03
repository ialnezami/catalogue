import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: <XCircle size={48} color="#ef4444" />,
      confirmBg: '#ef4444',
      confirmHover: '#dc2626',
      border: '#ef4444',
    },
    warning: {
      icon: <AlertTriangle size={48} color="#f59e0b" />,
      confirmBg: '#f59e0b',
      confirmHover: '#d97706',
      border: '#f59e0b',
    },
    info: {
      icon: <Info size={48} color="#3b82f6" />,
      confirmBg: '#3b82f6',
      confirmHover: '#2563eb',
      border: '#3b82f6',
    },
    success: {
      icon: <CheckCircle size={48} color="#10b981" />,
      confirmBg: '#10b981',
      confirmHover: '#059669',
      border: '#10b981',
    },
  };

  const style = typeStyles[type];

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
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '16px',
          border: `2px solid ${style.border}`,
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          animation: 'slideIn 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: `${style.border}15`,
            }}>
              {style.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                {title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1.5rem',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            <X size={24} />
          </button>
        </div>

        <p style={{ 
          color: '#4b5563', 
          fontSize: '1rem', 
          lineHeight: '1.6', 
          marginBottom: '2rem',
          paddingLeft: '80px',
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: style.confirmBg,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = style.confirmHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = style.confirmBg;
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

