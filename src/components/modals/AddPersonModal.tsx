import React, { useState } from 'react';
import { useAccounts } from '../../context/AccountsContext';
import { X, UserPlus, AlertCircle } from 'lucide-react';

export const AddPersonModal: React.FC = () => {
  const { addPersonModalOpen, setAddPersonModalOpen, addPerson } = useAccounts();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');

  if (!addPersonModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter person name.');
      return;
    }

    if (!mobileNumber.trim()) {
      setError('Please enter mobile number.');
      return;
    }

    addPerson(name, mobileNumber);
    setName('');
    setMobileNumber('');
    setAddPersonModalOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => setAddPersonModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} style={{ color: 'var(--primary-accent)' }} />
            <h2 className="modal-title">Add New Person</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setAddPersonModalOpen(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
            />
            <div className="form-hint">Used for identification and quick search in the Khata.</div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary">
              Save Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
