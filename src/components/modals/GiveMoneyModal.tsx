import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../context/AccountsContext';
import { X, Plus, AlertCircle } from 'lucide-react';
import { getTodayDateString, getCurrentTimeString, formatINR } from '../../utils/formatters';

const COMMON_REMARKS = [
  'Medical Help',
  'Emergency',
  'Personal Need',
  'Advance',
  'Temporary Help',
  'Shop Purchase',
  'Family Help'
];

export const GiveMoneyModal: React.FC = () => {
  const {
    giveMoneyModalOpen,
    setGiveMoneyModalOpen,
    modalPreselectedPersonId,
    people,
    giveMoney,
    openAddPerson
  } = useAccounts();

  const [personId, setPersonId] = useState<string>('');
  const [amountGiven, setAmountGiven] = useState<string>('');
  const [dateGiven, setDateGiven] = useState<string>(getTodayDateString());
  const [timeGiven, setTimeGiven] = useState<string>(getCurrentTimeString());
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (giveMoneyModalOpen) {
      setError('');
      setDateGiven(getTodayDateString());
      setTimeGiven(getCurrentTimeString());
      setAmountGiven('');
      setExpectedReturnDate('');
      setRemark('');

      if (modalPreselectedPersonId) {
        setPersonId(modalPreselectedPersonId);
      } else if (people.length > 0) {
        setPersonId(people[0].id);
      } else {
        setPersonId('');
      }
    }
  }, [giveMoneyModalOpen, modalPreselectedPersonId, people]);

  if (!giveMoneyModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!personId) {
      setError('Please select a person or add a new person.');
      return;
    }

    const parsedAmount = parseFloat(amountGiven.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!dateGiven) {
      setError('Please select the date given.');
      return;
    }

    giveMoney({
      personId,
      amountGiven: parsedAmount,
      dateGiven,
      timeGiven: timeGiven || '12:00',
      expectedReturnDate: expectedReturnDate || '',
      remark: remark || 'Help / Advance'
    });

    setGiveMoneyModalOpen(false);
  };

  const numAmount = parseFloat(amountGiven.replace(/,/g, ''));

  return (
    <div className="modal-backdrop" onClick={() => setGiveMoneyModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0f172a' }}></span>
            <h2 className="modal-title">Give Money (New Transaction)</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setGiveMoneyModalOpen(false)}
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

          {/* Person Selection */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Select Person *</label>
              <button
                type="button"
                onClick={() => openAddPerson()}
                style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Plus size={14} /> New Person
              </button>
            </div>

            {people.length === 0 ? (
              <div style={{ padding: 10, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                No people registered yet.{' '}
                <button
                  type="button"
                  onClick={() => openAddPerson()}
                  style={{ textDecoration: 'underline', background: 'none', border: 'none', fontWeight: 700, color: 'inherit', cursor: 'pointer' }}
                >
                  Add a person first
                </button>
              </div>
            ) : (
              <select
                className="form-select"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                required
              >
                <option value="" disabled>-- Select Person --</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mobileNumber})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Given */}
          <div className="form-group">
            <label className="form-label">Amount Given (₹) *</label>
            <div className="amount-input-wrap">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                className="form-input amount-input"
                placeholder="50,000"
                value={amountGiven}
                onChange={(e) => setAmountGiven(e.target.value)}
                required
                autoFocus
              />
            </div>
            {!isNaN(numAmount) && numAmount > 0 && (
              <div className="form-hint" style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>
                {formatINR(numAmount)} • Generates ~{formatINR((numAmount * 0.175) / 365, true)}/day in financing cost
              </div>
            )}
          </div>

          {/* Date & Time Given */}
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

          {/* Expected Return Date */}
          <div className="form-group">
            <label className="form-label">Expected Return Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
            />
            <div className="form-hint">Used to detect and warn when a transaction becomes Overdue.</div>
          </div>

          {/* Remark */}
          <div className="form-group">
            <label className="form-label">Remark / Purpose</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Medical Help, Emergency, Advance"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <div className="quick-tags">
              {COMMON_REMARKS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="quick-tag"
                  onClick={() => setRemark(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-give">
              Confirm & Give Money
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
