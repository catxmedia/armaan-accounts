import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../context/AccountsContext';
import { X, UserCheck, AlertTriangle, AlertCircle } from 'lucide-react';

export const EditPersonModal: React.FC = () => {
  const { editingPerson, setEditingPerson, editPerson, people } = useAccounts();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name);
      setMobileNumber(editingPerson.mobileNumber);
      setError('');
      setIsSubmitting(false);
    }
  }, [editingPerson]);

  if (!editingPerson) return null;

  // Check for duplicate mobile number in real time
  const cleanMobile = mobileNumber.trim();
  const duplicatePerson = people.find(
    (p) => p.id !== editingPerson.id && p.mobileNumber.trim() === cleanMobile && cleanMobile.length > 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a valid name.');
      return;
    }

    if (!mobileNumber.trim()) {
      setError('Please enter a mobile number.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      editPerson(editingPerson.id, {
        name: name.trim(),
        mobileNumber: cleanMobile
      });
      setIsSubmitting(false);
      setEditingPerson(null);
    }, 250);
  };

  return (
    <div className="modal-backdrop" onClick={() => setEditingPerson(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={18} style={{ color: 'var(--primary-accent)' }} />
            <h2 className="modal-title">Edit Person</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setEditingPerson(null)}
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

          {duplicatePerson && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 12
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0, color: '#d97706' }} />
              <span>
                <b>Warning:</b> This mobile number is already used by <b>{duplicatePerson.name}</b>.
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
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
              inputMode="tel"
              className="form-input"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
            />
            <div className="form-hint">Used to identify this account in the Khata.</div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
