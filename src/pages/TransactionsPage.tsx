import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { Search, ChevronRight } from 'lucide-react';
import { formatINR, formatCost, formatDate } from '../utils/formatters';
import { calculateTransactionCost, getDaysOverdue } from '../utils/calculator';
import type { TransactionStatus } from '../types';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    people,
    settings,
    now,
    openGiveMoney,
    setSelectedTransactionId
  } = useAccounts();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TransactionStatus>('All');

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
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
      .filter(({ tx, person, breakdown }) => {
        // Status filter
        if (statusFilter !== 'All' && breakdown.status !== statusFilter) {
          return false;
        }

        // Search query (Transaction number, person name, remark)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTxNum = tx.transactionNumber.toLowerCase().includes(q);
          const matchPerson = person?.name.toLowerCase().includes(q) || false;
          const matchRemark = tx.remark?.toLowerCase().includes(q) || false;
          if (!matchTxNum && !matchPerson && !matchRemark) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        return new Date(`${b.tx.dateGiven}T${b.tx.timeGiven || '00:00'}`).getTime() -
               new Date(`${a.tx.dateGiven}T${a.tx.timeGiven || '00:00'}`).getTime();
      });
  }, [transactions, people, statusFilter, searchQuery, now, settings.annualRate]);

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Search Bar */}
      <div className="search-bar">
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by transaction no, person or remark..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Pills: All, Open, Partially Repaid, Closed, Overdue */}
      <div className="filter-scroll">
        {(['All', 'Open', 'Partially Repaid', 'Closed', 'Overdue'] as const).map((filter) => {
          const isActive = statusFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No transactions found</div>
          <div className="empty-desc">
            {searchQuery || statusFilter !== 'All'
              ? 'Try changing your search term or filter.'
              : 'No transactions recorded yet.'}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openGiveMoney()}
            style={{ width: 'auto', margin: '0 auto' }}
          >
            Give Money
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTransactions.map(({ tx, person, breakdown, daysOverdue }) => {
            const statusClass = breakdown.status.toLowerCase().replace(/\s+/g, '-');
            const isClosed = breakdown.isClosed;

            return (
              <div
                key={tx.id}
                className="card"
                onClick={() => setSelectedTransactionId(tx.id)}
                style={{
                  padding: 14,
                  cursor: 'pointer',
                  borderLeft: breakdown.status === 'Overdue'
                    ? '4px solid #ef4444'
                    : isClosed
                    ? '4px solid #10b981'
                    : '4px solid #3b82f6',
                  transition: 'transform 0.1s ease'
                }}
              >
                {/* Header: Transaction Number, Person Name & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)', letterSpacing: 0.3 }}>
                        {tx.transactionNumber}
                      </span>
                      <span className={`status-badge ${statusClass}`}>
                        {breakdown.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                      {person?.name || 'Unknown'}
                    </h4>
                  </div>

                  <ChevronRight size={18} style={{ color: 'var(--text-light)', marginTop: 2 }} />
                </div>

                {/* Amounts Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    padding: '8px 10px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    fontSize: 12,
                    margin: '8px 0'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Original Given</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatINR(tx.amountGiven)}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Current Outstanding</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: breakdown.outstanding > 0 ? '#b91c1c' : '#047857' }}>
                      {formatINR(breakdown.outstanding)}
                    </div>
                  </div>
                </div>

                {/* Dates & Remark */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><b>Given:</b> {formatDate(tx.dateGiven)}</span>
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

                  {tx.remark && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                      "{tx.remark}"
                    </div>
                  )}
                </div>

                {/* Footer: Financing Cost */}
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
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isClosed ? 'Final Financing Cost' : 'Current Financing Cost (Live)'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-accent)', fontVariantNumeric: 'tabular-nums' }}>
                    {isClosed && tx.finalFinancingCost !== undefined
                      ? formatCost(tx.finalFinancingCost)
                      : formatCost(breakdown.totalCost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
