import React, { useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { Header } from './Header';
import {
  Phone,
  PlusCircle,
  ArrowDownLeft,
  ChevronRight,
  Edit3,
  Archive,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { formatINR, formatCost, formatDate } from '../utils/formatters';
import { calculateTransactionCost, getDaysOverdue } from '../utils/calculator';

export const PersonDetailView: React.FC = () => {
  const {
    selectedPersonId,
    setSelectedPersonId,
    people,
    transactions,
    settings,
    now,
    openGiveMoney,
    openRecordReturn,
    setSelectedTransactionId,
    setEditingPerson,
    archivePerson,
    restorePerson,
    deletePerson,
    setConfirmDialog
  } = useAccounts();

  const person = people.find((p) => p.id === selectedPersonId);

  // All transactions for this person sorted chronologically
  const personTransactions = useMemo(() => {
    if (!selectedPersonId) return [];
    return transactions
      .filter((t) => t.personId === selectedPersonId)
      .sort((a, b) => {
        return new Date(`${b.dateGiven}T${b.timeGiven || '00:00'}`).getTime() -
               new Date(`${a.dateGiven}T${a.timeGiven || '00:00'}`).getTime();
      });
  }, [transactions, selectedPersonId]);

  // Aggregate statistics
  const stats = useMemo(() => {
    let totalGiven = 0;
    let totalReturned = 0;
    let totalOutstanding = 0;
    let totalDailyCost = 0;
    let totalFinancingCost = 0;
    let openCount = 0;
    let closedCount = 0;

    for (const tx of personTransactions) {
      const breakdown = calculateTransactionCost(tx, now, settings.annualRate);
      totalGiven += tx.amountGiven;
      totalReturned += breakdown.totalReturned;
      totalOutstanding += breakdown.outstanding;
      totalDailyCost += breakdown.dailyCost;

      const txCost = breakdown.isClosed && tx.finalFinancingCost !== undefined
        ? tx.finalFinancingCost
        : breakdown.totalCost;
      totalFinancingCost += txCost;

      if (breakdown.isClosed) {
        closedCount++;
      } else {
        openCount++;
      }
    }

    return {
      totalGiven,
      totalReturned,
      totalOutstanding,
      totalDailyCost,
      totalFinancingCost,
      openCount,
      closedCount
    };
  }, [personTransactions, now, settings.annualRate]);

  if (!person) {
    return (
      <div>
        <Header title="Person Account" showBack onBack={() => setSelectedPersonId(null)} />
        <div className="empty-state">Person not found.</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <Header
        title={person.name}
        showBack
        onBack={() => setSelectedPersonId(null)}
      />

      {/* Archived Status Notice */}
      {person.isArchived && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 12,
            color: '#92400e',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <span>
            <b>Archived Person:</b> This person is hidden from the active list. Historical calculations remain active.
          </span>
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={() => restorePerson(person.id)}
            style={{ padding: '5px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
          >
            <RotateCcw size={12} />
            <span>Restore</span>
          </button>
        </div>
      )}

      {/* Top Person Account Summary Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          border: 'none',
          boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: -0.3 }}>
              {person.name}
            </h2>
            <a
              href={`tel:${person.mobileNumber}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: '#94a3b8',
                fontSize: 13,
                textDecoration: 'none',
                marginTop: 2,
                fontWeight: 600
              }}
            >
              <Phone size={13} />
              <span>{person.mobileNumber}</span>
            </a>
          </div>

          <span
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#38bdf8',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6
            }}
          >
            {settings.annualRate}% Rate
          </span>
        </div>

        {/* Current Outstanding Hero */}
        <div style={{ marginTop: 14, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Current Outstanding Balance
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: stats.totalOutstanding > 0 ? '#f87171' : '#34d399', fontVariantNumeric: 'tabular-nums' }}>
            {formatINR(stats.totalOutstanding)}
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>
            Generating <b>{formatCost(stats.totalDailyCost)}</b> in financing cost every day
          </div>
        </div>

        {/* Aggregate 4-stat Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: 12
          }}
        >
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Financing Cost</div>
            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: 16 }}>{formatCost(stats.totalFinancingCost)}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Money Given</div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 16 }}>{formatINR(stats.totalGiven)}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Returned</div>
            <div style={{ fontWeight: 800, color: '#34d399', fontSize: 16 }}>{formatINR(stats.totalReturned)}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Transactions</div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 14 }}>
              {stats.openCount} Open • {stats.closedCount} Closed
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Quick Action Buttons for This Person */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-give"
          onClick={() => openGiveMoney(person.id)}
          style={{ padding: '10px 12px', minHeight: 44, fontSize: 13, justifyContent: 'center' }}
        >
          <PlusCircle size={16} />
          <span>Give Money</span>
        </button>

        <button
          type="button"
          className="btn btn-return"
          onClick={() => openRecordReturn(undefined, person.id)}
          disabled={stats.totalOutstanding <= 0}
          style={{
            padding: '10px 12px',
            minHeight: 44,
            fontSize: 13,
            justifyContent: 'center',
            opacity: stats.totalOutstanding <= 0 ? 0.5 : 1
          }}
        >
          <ArrowDownLeft size={16} />
          <span>Record Return</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setEditingPerson(person)}
          style={{ padding: '10px 12px', minHeight: 44, fontSize: 13, justifyContent: 'center' }}
        >
          <Edit3 size={15} />
          <span>Edit Person</span>
        </button>

        {person.isArchived ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => restorePerson(person.id)}
            style={{ padding: '10px 12px', minHeight: 44, fontSize: 13, justifyContent: 'center', color: '#047857' }}
          >
            <RotateCcw size={15} />
            <span>Restore Person</span>
          </button>
        ) : personTransactions.length === 0 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Delete Person',
                message: `Permanently delete ${person.name}?`,
                warningNote: 'This person has no transaction history and will be removed permanently.',
                confirmText: 'Delete Person',
                danger: true,
                onConfirm: () => {
                  const res = deletePerson(person.id);
                  if (res.success) {
                    setSelectedPersonId(null);
                  }
                }
              });
            }}
            style={{ padding: '10px 12px', minHeight: 44, fontSize: 13, justifyContent: 'center', color: '#dc2626' }}
          >
            <Trash2 size={15} />
            <span>Delete Person</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Archive Person',
                message: `Archive ${person.name}'s account?`,
                warningNote: 'Archived people are hidden from the active list. All transaction history, costs, and records will be safely preserved and can be restored at any time.',
                confirmText: 'Archive Person',
                danger: false,
                onConfirm: () => {
                  archivePerson(person.id);
                }
              });
            }}
            style={{ padding: '10px 12px', minHeight: 44, fontSize: 13, justifyContent: 'center' }}
          >
            <Archive size={15} />
            <span>Archive Person</span>
          </button>
        )}
      </div>

      {/* Transactions Section */}
      <div className="section-title-wrap">
        <h3 className="section-title">Khata Transactions ({personTransactions.length})</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tap card for full details</span>
      </div>

      {personTransactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No transactions yet</div>
          <div className="empty-desc">Tap "Give More Money" to start a transaction for {person.name}.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {personTransactions.map((tx) => {
            const breakdown = calculateTransactionCost(tx, now, settings.annualRate);
            const statusClass = breakdown.status.toLowerCase().replace(/\s+/g, '-');
            const isClosed = breakdown.isClosed;
            const daysOverdue = breakdown.status === 'Overdue' ? getDaysOverdue(tx.expectedReturnDate, now) : 0;

            let runningBal = tx.amountGiven;
            const sortedReturns = [...tx.returns].sort((a, b) =>
              new Date(`${a.returnDate}T${a.returnTime || '00:00'}`).getTime() -
              new Date(`${b.returnDate}T${b.returnTime || '00:00'}`).getTime()
            );

            return (
              <div
                key={tx.id}
                className="card"
                onClick={() => setSelectedTransactionId(tx.id)}
                style={{
                  cursor: 'pointer',
                  padding: 14,
                  borderLeft: breakdown.status === 'Overdue'
                    ? '4px solid #ef4444'
                    : isClosed
                    ? '4px solid #10b981'
                    : '4px solid #3b82f6',
                  transition: 'transform 0.1s ease'
                }}
              >
                {/* Header row: Transaction Number & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)', letterSpacing: 0.3 }}>
                      {tx.transactionNumber}
                    </span>
                    <span className={`status-badge ${statusClass}`}>
                      {breakdown.status}
                    </span>
                  </div>

                  <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />
                </div>

                {/* Amount Given & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatINR(tx.amountGiven)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>Given</span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {formatDate(tx.dateGiven)}
                  </div>
                </div>

                {/* Remark & Expected Return Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <span><b>Remark:</b> {tx.remark || 'Help / Advance'}</span>
                  {tx.expectedReturnDate && (
                    <span>
                      <b>Expected:</b> {formatDate(tx.expectedReturnDate)}
                      {daysOverdue > 0 && (
                        <span style={{ color: '#b91c1c', fontWeight: 700, marginLeft: 4 }}>
                          ({daysOverdue}d overdue)
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Chronological Repayment Steps */}
                {sortedReturns.length > 0 && (
                  <div className="repayment-history-box">
                    <div className="repayment-history-title">Repayment Steps & Balance</div>
                    {sortedReturns.map((ret) => {
                      runningBal = Math.max(0, runningBal - ret.returnedAmount);
                      return (
                        <div key={ret.id} className="repayment-item">
                          <div>
                            <span style={{ color: '#047857', fontWeight: 700 }}>+{formatINR(ret.returnedAmount)}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                              on {formatDate(ret.returnDate)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Balance: </span>
                            <span style={{ fontWeight: 700, color: runningBal === 0 ? '#047857' : 'var(--text-main)' }}>
                              {formatINR(runningBal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Card Footer: Current Balance & Financing Cost */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-light)',
                    fontSize: 12
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Outstanding: </span>
                    <span style={{ fontWeight: 800, color: breakdown.outstanding > 0 ? '#b91c1c' : '#047857' }}>
                      {formatINR(breakdown.outstanding)}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {isClosed ? 'Final Cost: ' : 'Financing Cost: '}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--primary-accent)', fontVariantNumeric: 'tabular-nums' }}>
                      {isClosed && tx.finalFinancingCost !== undefined
                        ? formatCost(tx.finalFinancingCost)
                        : formatCost(breakdown.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
