import React from 'react';
import { useAccounts } from '../context/AccountsContext';
import { CheckCircle2, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useAccounts();

  if (!toast) return null;

  const handleUndo = () => {
    if (toast.undoAction) {
      toast.undoAction();
    }
    hideToast();
  };

  return (
    <aside
      className="toast-container"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 440,
        zIndex: 9999,
        background: '#0f172a',
        color: '#ffffff',
        padding: '10px 14px',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        fontSize: 13,
        fontWeight: 600,
        animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <CheckCircle2 size={17} style={{ color: '#10b981', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {toast.message}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {toast.undoAction && (
          <button
            type="button"
            onClick={handleUndo}
            style={{
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {toast.undoLabel || 'Undo'}
          </button>
        )}

        <button
          type="button"
          onClick={hideToast}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Dismiss toast"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
};
