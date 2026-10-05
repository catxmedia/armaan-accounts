import React from 'react';
import { useAccounts } from '../context/AccountsContext';
import { ArrowLeft, Clock } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  const { now, selectedPersonId, setSelectedPersonId, selectedTransactionId, setSelectedTransactionId } = useAccounts();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (selectedTransactionId) {
      setSelectedTransactionId(null);
    } else if (selectedPersonId) {
      setSelectedPersonId(null);
    }
  };

  const isSubPage = showBack || !!selectedPersonId || !!selectedTransactionId;

  return (
    <header className="app-header">
      <div className="header-brand">
        {isSubPage ? (
          <button
            onClick={handleBack}
            className="btn-sm btn-secondary"
            style={{ padding: '6px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>Back</span>
          </button>
        ) : (
          <img
            src="/Favicon.png"
            alt="Armaan Accounts"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
          />
        )}

        <div className="header-title-wrap">
          <h1>{title || 'Armaan Accounts'}</h1>
          <p>Digital Khata • 17.5% Financing Cost</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
        <Clock size={13} style={{ color: '#10b981' }} />
        <span>{formatTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)}</span>
      </div>
    </header>
  );
};
