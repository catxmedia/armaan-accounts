import React from 'react';
import { useAccounts } from '../../context/AccountsContext';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { confirmDialog, closeConfirmDialog } = useAccounts();

  if (!confirmDialog || !confirmDialog.isOpen) return null;

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    closeConfirmDialog();
  };

  return (
    <div className="modal-backdrop" onClick={closeConfirmDialog}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle
              size={20}
              style={{ color: confirmDialog.danger ? '#ef4444' : '#f59e0b' }}
            />
            <h2 className="modal-title">{confirmDialog.title}</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeConfirmDialog}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px' }}>
          <p style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: 12 }}>
            {confirmDialog.message}
          </p>

          {confirmDialog.warningNote && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: '#991b1b',
                lineHeight: 1.4,
                marginBottom: 14
              }}
            >
              <b>Important:</b> {confirmDialog.warningNote}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeConfirmDialog}
            >
              Cancel
            </button>

            <button
              type="button"
              className={`btn ${confirmDialog.danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirm}
              style={{
                background: confirmDialog.danger ? '#dc2626' : undefined,
                color: '#ffffff'
              }}
            >
              {confirmDialog.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
