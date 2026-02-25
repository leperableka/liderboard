import React, { useEffect } from 'react';

interface ModalProps {
  visible: boolean;
  title: string;
  subtitle?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  subtitle,
  onCancel,
  onConfirm,
  cancelLabel = 'Отмена',
  confirmLabel = 'Подтвердить',
  loading = false,
}) => {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          padding: '24px 20px 36px',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <p
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text)',
            textAlign: 'center',
            margin: '0 0 4px',
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-2)',
              textAlign: 'center',
              margin: '0 0 20px',
            }}
          >
            {subtitle}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: '2px solid var(--border)',
              background: 'transparent',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: 'none',
              background: loading ? '#D1D5DB' : 'var(--gold-grad)',
              fontSize: 16,
              fontWeight: 600,
              color: loading ? '#9CA3AF' : '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font)',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(245,166,35,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Сохранение...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
