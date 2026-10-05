import React, { useState, useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { Search, UserPlus, Phone, ChevronRight, Edit2, RotateCcw, ArrowUpDown, Archive } from 'lucide-react';
import { formatINR, formatCost, formatRelativeActivity } from '../utils/formatters';
import { calculateTransactionCost } from '../utils/calculator';

type SortOption = 'recent' | 'outstanding' | 'cost' | 'name';

export const PeoplePage: React.FC = () => {
  const {
    people,
    transactions,
    settings,
    now,
    openAddPerson,
    setSelectedPersonId,
    setEditingPerson,
    restorePerson
  } = useAccounts();

  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts for tabs
  const activeCount = useMemo(() => people.filter((p) => !p.isArchived).length, [people]);
  const archivedCount = useMemo(() => people.filter((p) => !!p.isArchived).length, [people]);

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

  // Filter based on active vs archived
  const tabPeople = useMemo(() => {
    return personCardData.filter((item) => {
      if (viewTab === 'archived') {
        return !!item.person.isArchived;
      }
      return !item.person.isArchived;
    });
  }, [personCardData, viewTab]);

  // Filter based on search query (name or mobile)
  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabPeople;
    return tabPeople.filter(
      (item) =>
        item.person.name.toLowerCase().includes(q) ||
        item.person.mobileNumber.toLowerCase().includes(q)
    );
  }, [tabPeople, searchQuery]);

  // Sort people
  const sortedPeople = useMemo(() => {
    return [...searchFiltered].sort((a, b) => {
      if (sortBy === 'outstanding') {
        return b.currentOutstanding - a.currentOutstanding;
      }
      if (sortBy === 'cost') {
        return b.totalFinancingCost - a.totalFinancingCost;
      }
      if (sortBy === 'name') {
        return a.person.name.localeCompare(b.person.name);
      }
      // Default: recent activity
      return b.lastActivityTimestamp - a.lastActivityTimestamp;
    });
  }, [searchFiltered, sortBy]);

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Active vs Archived Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 12,
          background: '#f1f5f9',
          padding: 4,
          borderRadius: 12
        }}
      >
        <button
          type="button"
          onClick={() => setViewTab('active')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            background: viewTab === 'active' ? '#ffffff' : 'transparent',
            color: viewTab === 'active' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: viewTab === 'active' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Active People ({activeCount})
        </button>

        <button
          type="button"
          onClick={() => setViewTab('archived')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            background: viewTab === 'archived' ? '#ffffff' : 'transparent',
            color: viewTab === 'archived' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: viewTab === 'archived' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Archived ({archivedCount})
        </button>
      </div>

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

        {viewTab === 'active' && (
          <button
            type="button"
            className="btn-sm btn-primary"
            onClick={() => openAddPerson()}
            style={{
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 700
            }}
          >
            <UserPlus size={16} />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Sort Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '0 2px'
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {sortedPeople.length} {sortedPeople.length === 1 ? 'person' : 'people'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-main)',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="recent">Recent Activity</option>
            <option value="outstanding">Highest Outstanding</option>
            <option value="cost">Highest Financing Cost</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* People Cards List */}
      {sortedPeople.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? (
            <>
              <div className="empty-title">No results found</div>
              <div className="empty-desc">No person matched "{searchQuery}".</div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchQuery('')}
                style={{ width: 'auto', margin: '10px auto 0' }}
              >
                Clear Search
              </button>
            </>
          ) : viewTab === 'archived' ? (
            <>
              <Archive size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', opacity: 0.5 }} />
              <div className="empty-title">No archived people</div>
              <div className="empty-desc">
                Archived accounts are kept here safely and can be restored at any time.
              </div>
            </>
          ) : (
            <>
              <div className="empty-title">No people added yet</div>
              <div className="empty-desc">Add your first person to start tracking Khata transactions.</div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openAddPerson()}
                style={{ width: 'auto', margin: '10px auto 0' }}
              >
                Add First Person
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedPeople.map((item) => {
            const { person, currentOutstanding, totalFinancingCost, openTransactionsCount, lastActivityDate, lastActivityTime } = item;

            return (
              <div
                key={person.id}
                className="card"
                onClick={() => setSelectedPersonId(person.id)}
                style={{
                  padding: 14,
                  cursor: 'pointer',
                  borderLeft: person.isArchived
                    ? '4px solid #94a3b8'
                    : currentOutstanding > 0
                    ? '4px solid #ef4444'
                    : '4px solid #10b981',
                  transition: 'transform 0.1s ease',
                  opacity: person.isArchived ? 0.85 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                        {person.name}
                      </h3>
                      {person.isArchived && (
                        <span
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4
                          }}
                        >
                          Archived
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                      <Phone size={12} />
                      <span>{person.mobileNumber}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPerson(person);
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                      title="Edit Person"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>

                    {person.isArchived && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          restorePerson(person.id);
                        }}
                        style={{
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          color: '#047857',
                          cursor: 'pointer'
                        }}
                        title="Restore Person"
                      >
                        <RotateCcw size={12} />
                        <span>Restore</span>
                      </button>
                    )}

                    <ChevronRight size={18} style={{ color: 'var(--text-light)', marginLeft: 2 }} />
                  </div>
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
