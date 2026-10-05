import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../context/AccountsContext';
import type { Transaction } from '../../types';
import { X, Edit3, AlertCircle } from 'lucide-react';
import { parseDateTime } from '../../utils/calculator';
import { formatDate, formatTime } from '../../utils/formatters';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, isOpen, onClose }) => {
  const { editTransaction, people } = useAccounts();

  const [amountGiven, setAmountGiven] = useState<string>('');
  const [dateGiven, setDateGiven] = useState<string>('');
  const [timeGiven, setTimeGiven] = useState<string>('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (transaction && isOpen) {
      setAmountGiven(String(transaction.amountGiven));
      setDateGiven(transaction.dateGiven);
      setTimeGiven(transaction.timeGiven);
      setExpectedReturnDate(transaction.expectedReturnDate || '');
      setRemark(transaction.remark || '');
      setReason('');
      setError('');
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const person = people.find((p) => p.id === transaction.personId);
  const totalReturned = transaction.returns.reduce((sum, r) => sum + r.returnedAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmt = parseFloat(amountGiven.replace(/,/g, ''));
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Amount given must be greater than zero.');
      return;
    }

    if (parsedAmt < totalReturned) {
      setError(`Amount given cannot be less than the total already returned (₹${totalReturned.toLocaleString('en-IN')}).`);
      return;
    }

    if (!dateGiven) {
      setError('Date given is required.');
      return;
    }

    // Check if new given date/time is after any return date/time
    const newGivenTime = parseDateTime(dateGiven, timeGiven || '00:00');
    for (const ret of transaction.returns) {
      const retTime = parseDateTime(ret.returnDate, ret.returnTime || '00:00');
      if (newGivenTime.getTime() > retTime.getTime()) {
        setError(`Money given date & time cannot be after repayment recorded on ${formatDate(ret.returnDate)} ${formatTime(ret.returnTime)}.`);
        return;
      }
    }

    editTransaction(
      transaction.id,
      {
        amountGiven: parsedAmt,
        dateGiven,
        timeGiven: timeGiven || '12:00',
        expectedReturnDate,
        remark: remark.trim()
      },
      reason.trim() || 'Correction'
    );

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit3 size={18} style={{ color: 'var(--primary-accent)' }} />
            <h2 className="modal-title">Edit {transaction.transactionNumber}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
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

          <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            <div>Person: <b>{person?.name || 'Unknown'}</b> ({person?.mobileNumber})</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
              Changes will be recorded in the audit trail with timestamp.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount Given (₹) *</label>
            <div className="amount-input-wrap">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                step="any"
                min={totalReturned > 0 ? totalReturned : 1}
                className="form-input amount-input"
                value={amountGiven}
                onChange={(e) => setAmountGiven(e.target.value)}
                required
              />
            </div>
            {totalReturned > 0 && (
              <div className="form-hint" style={{ color: '#b45309' }}>
                Note: ₹{totalReturned.toLocaleString('en-IN')} has already been returned against this transaction.
              </div>
            )}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Date Given *</label>
              <input
                type="date"
                className="form-input"
                value={dateGiven}
                onChange={(e) => setDateGiven(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time Given *</label>
              <input
                type="time"
                className="form-input"
                value={timeGiven}
                onChange={(e) => setTimeGiven(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expected Return Date</label>
            <input
              type="date"
              className="form-input"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remark</label>
            <input
              type="text"
              className="form-input"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Editing (for Edit History)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Typo in amount, adjusted date"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary">
              Save Changes to History
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
