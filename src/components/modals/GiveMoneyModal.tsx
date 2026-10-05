import React, { useState, useEffect, useMemo } from 'react';
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
    transactions,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active (non-archived) people only for new money
  const activePeople = useMemo(() => {
    return people.filter((p) => !p.isArchived);
  }, [people]);

  // Compute recently used people from recent transactions
  const recentPeople = useMemo(() => {
    const recentIds = new Set<string>();
    const list: typeof activePeople = [];

    // Sort transactions newest first
    const sortedTxs = [...transactions].sort((a, b) => {
      return new Date(b.createdAt || `${b.dateGiven}T${b.timeGiven || '00:00'}`).getTime() -
             new Date(a.createdAt || `${a.dateGiven}T${a.timeGiven || '00:00'}`).getTime();
    });

    for (const tx of sortedTxs) {
      if (!recentIds.has(tx.personId)) {
        recentIds.add(tx.personId);
        const p = activePeople.find((ap) => ap.id === tx.personId);
        if (p) list.push(p);
      }
      if (list.length >= 4) break;
    }
    return list;
  }, [transactions, activePeople]);

  useEffect(() => {
    if (giveMoneyModalOpen) {
      setError('');
      setIsSubmitting(false);
      setDateGiven(getTodayDateString());
      setTimeGiven(getCurrentTimeString());
      setAmountGiven('');
      setExpectedReturnDate('');
      setRemark('');

      if (modalPreselectedPersonId) {
        setPersonId(modalPreselectedPersonId);
      } else if (recentPeople.length > 0) {
        setPersonId(recentPeople[0].id);
      } else if (activePeople.length > 0) {
        setPersonId(activePeople[0].id);
      } else {
        setPersonId('');
      }
    }
  }, [giveMoneyModalOpen, modalPreselectedPersonId, activePeople, recentPeople]);

  if (!giveMoneyModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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

    setIsSubmitting(true);
    setTimeout(() => {
      giveMoney({
        personId,
        amountGiven: parsedAmount,
        dateGiven,
        timeGiven: timeGiven || '12:00',
        expectedReturnDate: expectedReturnDate || '',
        remark: remark || 'Help / Advance'
      });
      setIsSubmitting(false);
      setGiveMoneyModalOpen(false);
    }, 250);
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

          {/* Recently Used People Chips */}
          {recentPeople.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Recent People
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recentPeople.map((rp) => (
                  <button
                    key={rp.id}
                    type="button"
                    onClick={() => setPersonId(rp.id)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '5px 10px',
                      borderRadius: 20,
                      background: personId === rp.id ? 'var(--primary)' : 'var(--bg-card-subtle)',
                      color: personId === rp.id ? '#ffffff' : 'var(--text-main)',
                      border: '1px solid var(--border-medium)',
                      cursor: 'pointer'
                    }}
                  >
                    {rp.name}
                  </button>
                ))}
              </div>
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

            {activePeople.length === 0 ? (
              <div style={{ padding: 10, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                No active people found.{' '}
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
                {activePeople.map((p) => (
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
                inputMode="decimal"
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
            <button
              type="submit"
              className="btn btn-give"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Confirm & Give Money'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
