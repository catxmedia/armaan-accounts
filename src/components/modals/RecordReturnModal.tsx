import React, { useState, useEffect, useMemo } from 'react';
import { useAccounts } from '../../context/AccountsContext';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { getTodayDateString, getCurrentTimeString, formatINR, formatDate, formatTime } from '../../utils/formatters';
import { parseDateTime } from '../../utils/calculator';

export const RecordReturnModal: React.FC = () => {
  const {
    recordReturnModalOpen,
    setRecordReturnModalOpen,
    modalPreselectedTransactionId,
    modalPreselectedPersonId,
    people,
    transactions,
    recordReturn
  } = useAccounts();

  const [personId, setPersonId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [returnedAmount, setReturnedAmount] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>(getTodayDateString());
  const [returnTime, setReturnTime] = useState<string>(getCurrentTimeString());
  const [remark, setRemark] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eligible transactions for the chosen person
  const personTransactions = useMemo(() => {
    if (!personId) return [];
    return transactions.filter((t) => {
      if (t.personId !== personId) return false;
      const totalRet = t.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
      return t.amountGiven - totalRet > 0.001; // Only open/partially repaid
    });
  }, [transactions, personId]);

  // Selected transaction details
  const selectedTx = useMemo(() => {
    return transactions.find((t) => t.id === transactionId);
  }, [transactions, transactionId]);

  const currentOutstanding = useMemo(() => {
    if (!selectedTx) return 0;
    const totalRet = selectedTx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
    return Math.max(0, selectedTx.amountGiven - totalRet);
  }, [selectedTx]);

  useEffect(() => {
    if (recordReturnModalOpen) {
      setError('');
      setIsSubmitting(false);
      setReturnDate(getTodayDateString());
      setReturnTime(getCurrentTimeString());
      setReturnedAmount('');
      setRemark('');

      if (modalPreselectedTransactionId) {
        const tx = transactions.find((t) => t.id === modalPreselectedTransactionId);
        if (tx) {
          setPersonId(tx.personId);
          setTransactionId(tx.id);
          return;
        }
      }

      if (modalPreselectedPersonId) {
        setPersonId(modalPreselectedPersonId);
        const openTxs = transactions.filter((t) => {
          if (t.personId !== modalPreselectedPersonId) return false;
          const ret = t.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
          return t.amountGiven - ret > 0.001;
        });
        if (openTxs.length > 0) {
          setTransactionId(openTxs[0].id);
        } else {
          setTransactionId('');
        }
      } else {
        // Find first person with open transactions
        const personWithOpenTx = people.find((p) => {
          return transactions.some((t) => {
            if (t.personId !== p.id) return false;
            const ret = t.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
            return t.amountGiven - ret > 0.001;
          });
        });

        if (personWithOpenTx) {
          setPersonId(personWithOpenTx.id);
          const openTxs = transactions.filter((t) => {
            if (t.personId !== personWithOpenTx.id) return false;
            const ret = t.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
            return t.amountGiven - ret > 0.001;
          });
          if (openTxs.length > 0) {
            setTransactionId(openTxs[0].id);
          }
        } else {
          setPersonId(people[0]?.id || '');
          setTransactionId('');
        }
      }
    }
  }, [recordReturnModalOpen, modalPreselectedTransactionId, modalPreselectedPersonId, people, transactions]);

  // When person changes, pick first open transaction
  const handlePersonChange = (newPersonId: string) => {
    setPersonId(newPersonId);
    const openTxs = transactions.filter((t) => {
      if (t.personId !== newPersonId) return false;
      const ret = t.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
      return t.amountGiven - ret > 0.001;
    });
    if (openTxs.length > 0) {
      setTransactionId(openTxs[0].id);
    } else {
      setTransactionId('');
    }
  };

  if (!recordReturnModalOpen) return null;

  const numEntered = parseFloat(returnedAmount.replace(/,/g, ''));
  const remainingAfterReturn = !isNaN(numEntered) ? Math.max(0, currentOutstanding - numEntered) : currentOutstanding;
  const isFullSettlement = !isNaN(numEntered) && Math.abs(currentOutstanding - numEntered) <= 0.001;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!personId) {
      setError('Please select a person.');
      return;
    }

    if (!transactionId || !selectedTx) {
      setError('Please select which transaction this return belongs to.');
      return;
    }

    if (isNaN(numEntered) || numEntered <= 0) {
      setError('Please enter a valid return amount greater than zero.');
      return;
    }

    if (numEntered > currentOutstanding + 0.001) {
      setError(`Returned amount cannot exceed the current outstanding balance of ${formatINR(currentOutstanding)}.`);
      return;
    }

    const givenTime = parseDateTime(selectedTx.dateGiven, selectedTx.timeGiven);
    const retTime = parseDateTime(returnDate, returnTime || '00:00');
    if (retTime.getTime() < givenTime.getTime()) {
      setError(`Return date and time (${formatDate(returnDate)} ${formatTime(returnTime)}) cannot be earlier than when money was given (${formatDate(selectedTx.dateGiven)} ${formatTime(selectedTx.timeGiven)}).`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = recordReturn({
        transactionId,
        returnedAmount: numEntered,
        returnDate,
        returnTime: returnTime || '12:00',
        remark: remark || undefined
      });

      setIsSubmitting(false);
      if (!result.success) {
        setError(result.error || 'Failed to record return.');
        return;
      }

      setRecordReturnModalOpen(false);
    }, 250);
  };

  return (
    <div className="modal-backdrop" onClick={() => setRecordReturnModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#047857' }}></span>
            <h2 className="modal-title">Record Money Return</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setRecordReturnModalOpen(false)}
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

          {/* Select Person */}
          <div className="form-group">
            <label className="form-label">Person Returning Money *</label>
            <select
              className="form-select"
              value={personId}
              onChange={(e) => handlePersonChange(e.target.value)}
              required
            >
              <option value="" disabled>-- Select Person --</option>
              {people.map((p) => {
                const openCount = transactions.filter((t) => {
                  if (t.personId !== p.id) return false;
                  const ret = t.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
                  return t.amountGiven - ret > 0.001;
                }).length;

                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {openCount > 0 ? `(${openCount} open tx)` : '(No open tx)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Prominent Visual Transaction Selector Cards */}
          <div className="form-group">
            <label className="form-label">Select Transaction for Repayment *</label>
            {personTransactions.length === 0 ? (
              <div style={{ padding: 10, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                This person currently has no open or partially repaid transactions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {personTransactions.map((tx) => {
                  const retSum = tx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
                  const bal = tx.amountGiven - retSum;
                  const isSelected = tx.id === transactionId;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setTransactionId(tx.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid var(--primary-accent)' : '1px solid var(--border-medium)',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-main)' }}>
                          {tx.transactionNumber}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Given: {formatDate(tx.dateGiven)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Original: </span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{formatINR(tx.amountGiven)}</span>
                          {tx.remark && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontStyle: 'italic' }}>
                              • "{tx.remark}"
                            </span>
                          )}
                        </div>

                        {/* Visually Prominent Outstanding Amount */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#b91c1c' }}>
                            Outstanding
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#b91c1c' }}>
                            {formatINR(bal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Returned Amount Entry (Manual) */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Returned Amount (₹) *</label>
              {currentOutstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setReturnedAmount(String(currentOutstanding))}
                  style={{ background: 'none', border: 'none', color: '#047857', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Full Amount ({formatINR(currentOutstanding)})
                </button>
              )}
            </div>
            <div className="amount-input-wrap">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="1"
                max={currentOutstanding || undefined}
                className="form-input amount-input"
                placeholder="Enter amount manually"
                value={returnedAmount}
                onChange={(e) => setReturnedAmount(e.target.value)}
                required
                disabled={!selectedTx || currentOutstanding <= 0}
              />
            </div>

            {!isNaN(numEntered) && numEntered > 0 && selectedTx && (
              <div
                style={{
                  marginTop: 6,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: isFullSettlement ? '#ecfdf5' : '#fffbeb',
                  fontSize: 12,
                  fontWeight: 600,
                  color: isFullSettlement ? '#047857' : '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isFullSettlement ? (
                  <>
                    <CheckCircle size={15} />
                    <span>Transaction will become <b>Closed</b> with ₹0 balance. Final cost will freeze.</span>
                  </>
                ) : (
                  <span>Remaining balance will become <b>{formatINR(remainingAfterReturn)}</b>. Financing cost will continue only on this remaining amount.</span>
                )}
              </div>
            )}
          </div>

          {/* Return Date & Return Time */}
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

          {/* Remark */}
          <div className="form-group">
            <label className="form-label">Optional Remark</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cash, GPay, Bank transfer, Installment 1"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn btn-return"
              disabled={!selectedTx || currentOutstanding <= 0 || isSubmitting}
            >
              {isSubmitting ? 'Recording Return...' : 'Record Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
