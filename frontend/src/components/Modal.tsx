import React, { useEffect, useRef } from 'react';

interface ModalProps {
  visible: boolean;
  title: string;
  subtitle?: React.ReactNode;
  /** Optional warning block shown between subtitle and buttons (yellow banner). */
  warning?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  loading?: boolean;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  subtitle,
  warning,
  onCancel,
  onConfirm,
  cancelLabel = 'Отмена',
  confirmLabel = 'Подтвердить',
  loading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll + Escape key + focus trap
  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        if (focusable.length === 0) { e.preventDefault(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Move focus into dialog
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      ref={dialogRef}
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
              margin: '0 0 12px',
            }}
          >
            {subtitle}
          </p>
        )}
        {warning && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: '#FFFBEB',
              border: '1.5px solid #F5A623',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#92610A',
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <span>{warning}</span>
          </div>
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
