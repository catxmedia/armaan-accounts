import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../context/AccountsContext';
import { X, Edit2, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const EditReturnModal: React.FC = () => {
  const { editingReturnData, setEditingReturnData, editReturn } = useAccounts();

  const [returnedAmount, setReturnedAmount] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingReturnData) {
      const { returnRecord } = editingReturnData;
      setReturnedAmount(String(returnRecord.returnedAmount));
      setReturnDate(returnRecord.returnDate);
      setReturnTime(returnRecord.returnTime || '12:00');
      setRemark(returnRecord.remark || '');
      setError('');
      setIsSubmitting(false);
    }
  }, [editingReturnData]);

  if (!editingReturnData) return null;

  const { transaction, returnRecord } = editingReturnData;

  // Maximum allowable amount for this return: original given minus all other returns
  const otherReturnsTotal = transaction.returns
    .filter((r) => r.id !== returnRecord.id)
    .reduce((sum, r) => sum + r.returnedAmount, 0);

  const maxAllowable = Math.max(0, transaction.amountGiven - otherReturnsTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmt = parseFloat(returnedAmount.replace(/,/g, ''));
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Returned amount must be greater than zero.');
      return;
    }

    if (parsedAmt > maxAllowable + 0.001) {
      setError(`Returned amount cannot exceed maximum allowable ${formatINR(maxAllowable)}.`);
      return;
    }

    if (!returnDate) {
      setError('Return date is required.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = editReturn(transaction.id, returnRecord.id, {
        returnedAmount: parsedAmt,
        returnDate,
        returnTime: returnTime || '12:00',
        remark: remark.trim() || undefined
      });

      setIsSubmitting(false);
      if (res.success) {
        setEditingReturnData(null);
      } else {
        setError(res.error || 'Failed to update repayment.');
      }
    }, 250);
  };

  return (
    <div className="modal-backdrop" onClick={() => setEditingReturnData(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit2 size={18} style={{ color: '#047857' }} />
            <h2 className="modal-title">Edit Repayment</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setEditingReturnData(null)}
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

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction:</span>
              <span style={{ fontWeight: 700 }}>{transaction.transactionNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)' }}>Original Amount Given:</span>
              <span style={{ fontWeight: 700 }}>{formatINR(transaction.amountGiven)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Max Allowable for this return:</span>
              <span style={{ fontWeight: 700, color: '#047857' }}>{formatINR(maxAllowable)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Returned Amount (₹) *</label>
            <div className="amount-input-wrap">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="1"
                max={maxAllowable}
                className="form-input amount-input"
                value={returnedAmount}
                onChange={(e) => setReturnedAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Return Date *</label>
              <input
                type="date"
                className="form-input"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Return Time *</label>
              <input
                type="time"
                className="form-input"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remark</label>
            <input
              type="text"
              className="form-input"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Cash, GPay, Bank Transfer"
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn btn-return"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recalculating...' : 'Update Repayment & Recalculate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
