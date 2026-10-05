import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { Search, UserPlus, Phone, ChevronRight } from 'lucide-react';
import { formatINR, formatCost, formatRelativeActivity } from '../utils/formatters';
import { calculateTransactionCost } from '../utils/calculator';

export const PeoplePage: React.FC = () => {
  const {
    people,
    transactions,
    settings,
    now,
    openAddPerson,
    setSelectedPersonId
  } = useAccounts();

  const [searchQuery, setSearchQuery] = useState('');

  // Compute stats for each person
  const personCardData = useMemo(() => {
    return people.map((person) => {
      const pTxs = transactions.filter((t) => t.personId === person.id);

      let currentOutstanding = 0;
      let totalFinancingCost = 0;
      let openTransactionsCount = 0;
      let lastActivityDate: string = person.createdAt;
      let lastActivityTime: string = '00:00';
      let lastActivityTimestamp = new Date(person.createdAt).getTime();

      for (const tx of pTxs) {
        const breakdown = calculateTransactionCost(tx, now, settings.annualRate);
        currentOutstanding += breakdown.outstanding;

        const cost = breakdown.isClosed && tx.finalFinancingCost !== undefined
          ? tx.finalFinancingCost
          : breakdown.totalCost;
        totalFinancingCost += cost;

        if (!breakdown.isClosed && breakdown.outstanding > 0) {
          openTransactionsCount++;
        }

        // Track last activity from transaction given date or returns
        const txTime = new Date(`${tx.dateGiven}T${tx.timeGiven || '00:00'}`).getTime();
        if (txTime > lastActivityTimestamp) {
          lastActivityTimestamp = txTime;
          lastActivityDate = tx.dateGiven;
          lastActivityTime = tx.timeGiven;
        }

        for (const ret of tx.returns) {
          const retTime = new Date(`${ret.returnDate}T${ret.returnTime || '00:00'}`).getTime();
          if (retTime > lastActivityTimestamp) {
            lastActivityTimestamp = retTime;
            lastActivityDate = ret.returnDate;
            lastActivityTime = ret.returnTime;
          }
        }
      }

      return {
        person,
        currentOutstanding,
        totalFinancingCost,
        openTransactionsCount,
        lastActivityDate,
        lastActivityTime,
        lastActivityTimestamp,
        totalTxsCount: pTxs.length
      };
    });
  }, [people, transactions, now, settings.annualRate]);

  // Filter based on search query (name or mobile)
  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return personCardData;
    return personCardData.filter(
      (item) =>
        item.person.name.toLowerCase().includes(q) ||
        item.person.mobileNumber.toLowerCase().includes(q)
    );
  }, [personCardData, searchQuery]);

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Search & Add Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div className="search-bar" style={{ flex: 1, margin: 0 }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-sm btn-primary"
          onClick={() => openAddPerson()}
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px' }}
        >
          <UserPlus size={16} />
          <span>Add</span>
        </button>
      </div>

      {/* People Cards */}
      {filteredPeople.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No people found</div>
          <div className="empty-desc">
            {searchQuery
              ? `No person matches "${searchQuery}".`
              : 'Add your first person to start tracking Khata transactions.'}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openAddPerson()}
            style={{ width: 'auto', margin: '0 auto' }}
          >
            Add Person
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredPeople.map((item) => {
            const { person, currentOutstanding, totalFinancingCost, openTransactionsCount, lastActivityDate, lastActivityTime } = item;

            return (
              <div
                key={person.id}
                className="card"
                onClick={() => setSelectedPersonId(person.id)}
                style={{
                  padding: 14,
                  cursor: 'pointer',
                  borderLeft: currentOutstanding > 0 ? '4px solid #ef4444' : '4px solid #10b981',
                  transition: 'transform 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                      {person.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                      <Phone size={12} />
                      <span>{person.mobileNumber}</span>
                    </div>
                  </div>

                  <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />
                </div>

                {/* Outstanding & Financing Cost Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    padding: '8px 10px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 8
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Current Outstanding</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: currentOutstanding > 0 ? '#b91c1c' : '#047857' }}>
                      {formatINR(currentOutstanding)}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total Financing Cost</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-accent)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCost(totalFinancingCost)}
                    </div>
                  </div>
                </div>

                {/* Open Tx & Last Activity Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>
                    <b>{openTransactionsCount}</b> {openTransactionsCount === 1 ? 'Open Transaction' : 'Open Transactions'}
                  </span>

                  <span>
                    Last activity: <b>{formatRelativeActivity(lastActivityDate, lastActivityTime)}</b>
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
