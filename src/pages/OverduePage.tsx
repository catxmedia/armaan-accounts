import React, { useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { AlertTriangle, ArrowDownLeft, Phone, ChevronRight } from 'lucide-react';
import { formatINR, formatCost, formatDate } from '../utils/formatters';
import { calculateTransactionCost, getDaysOverdue } from '../utils/calculator';

export const OverduePage: React.FC = () => {
  const {
    transactions,
    people,
    settings,
    now,
    openRecordReturn,
    setSelectedTransactionId
  } = useAccounts();

  // Find all overdue transactions
  const overdueItems = useMemo(() => {
    return transactions
      .map((tx) => {
        const person = people.find((p) => p.id === tx.personId);
        const breakdown = calculateTransactionCost(tx, now, settings.annualRate);
        const daysOverdue = breakdown.status === 'Overdue' ? getDaysOverdue(tx.expectedReturnDate, now) : 0;

        return {
          tx,
          person,
          breakdown,
          daysOverdue
        };
      })
      .filter((item) => item.breakdown.status === 'Overdue')
      .sort((a, b) => b.daysOverdue - a.daysOverdue); // Most overdue first
  }, [transactions, people, now, settings.annualRate]);

  // Aggregate overdue totals
  const totalOverdueAmount = useMemo(() => {
    return overdueItems.reduce((sum, item) => sum + item.breakdown.outstanding, 0);
  }, [overdueItems]);

  const totalOverdueDailyCost = useMemo(() => {
    return overdueItems.reduce((sum, item) => sum + item.breakdown.dailyCost, 0);
  }, [overdueItems]);

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Warning Summary Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
          color: '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          boxShadow: '0 8px 20px -4px rgba(153, 27, 27, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={20} style={{ color: '#fca5a5' }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Overdue Money Alert
          </h2>
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: '#fee2e2', fontVariantNumeric: 'tabular-nums' }}>
          {formatINR(totalOverdueAmount)}
        </div>

        <div style={{ fontSize: 12, color: '#fecaca', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>Across {overdueItems.length} {overdueItems.length === 1 ? 'transaction' : 'transactions'}</span>
          <span>Daily Cost: {formatCost(totalOverdueDailyCost)}/day</span>
        </div>
      </div>

      {overdueItems.length === 0 ? (
        <div className="empty-state">
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            ✓
          </div>
          <div className="empty-title">All Clear! No Overdue Money</div>
          <div className="empty-desc">
            No transactions have passed their expected return date with money outstanding.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {overdueItems.map(({ tx, person, breakdown, daysOverdue }) => {
            return (
              <div
                key={tx.id}
                className="card"
                style={{
                  padding: 14,
                  borderLeft: '4px solid #b91c1c',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Header: Person Name, Phone & Days Overdue Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>
                      {person?.name || 'Unknown'}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={12} />
                      <span>{person?.mobileNumber || '-'}</span>
                    </div>
                  </div>

                  <span
                    className="status-badge overdue"
                    style={{ fontSize: 11, padding: '4px 8px', fontWeight: 800 }}
                  >
                    {daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Overdue
                  </span>
                </div>

                {/* Outstanding Amount & Daily Cost */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    padding: '8px 10px',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 8
                  }}
                >
                  <div>
                    <div style={{ color: '#991b1b', fontSize: 11, fontWeight: 600 }}>Outstanding Amount</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#b91c1c' }}>
                      {formatINR(breakdown.outstanding)}
                    </div>
                    <div style={{ fontSize: 10, color: '#7f1d1d' }}>
                      of {formatINR(tx.amountGiven)} given
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#991b1b', fontSize: 11, fontWeight: 600 }}>Current Daily Cost</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#b91c1c' }}>
                      {formatCost(breakdown.dailyCost)}/day
                    </div>
                    <div style={{ fontSize: 10, color: '#7f1d1d' }}>
                      at {settings.annualRate}% p.a.
                    </div>
                  </div>
                </div>

                {/* Dates & Remark */}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><b>Expected Return Date:</b></span>
                    <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                      {formatDate(tx.expectedReturnDate)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><b>Given On:</b></span>
                    <span>{formatDate(tx.dateGiven)}</span>
                  </div>

                  {tx.remark && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><b>Remark:</b></span>
                      <span style={{ fontStyle: 'italic' }}>{tx.remark}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                    <span><b>Current Financing Cost (Live):</b></span>
                    <span style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>
                      {formatCost(breakdown.totalCost)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Record Return & View Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-sm btn-return"
                    onClick={() => openRecordReturn(tx.id, tx.personId)}
                    style={{ fontSize: 12, justifyContent: 'center' }}
                  >
                    <ArrowDownLeft size={14} />
                    <span>Record Return</span>
                  </button>

                  <button
                    type="button"
                    className="btn-sm btn-secondary"
                    onClick={() => setSelectedTransactionId(tx.id)}
                    style={{ fontSize: 12, justifyContent: 'center' }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
