import React, { useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import {
  calculateTransactionCost,
  calculateTodayFinancingCost
} from '../utils/calculator';
import { formatINR, formatCost, formatRelativeActivity, formatDate } from '../utils/formatters';
import {
  PlusCircle,
  ArrowDownLeft,
  Users,
  AlertTriangle,
  Clock,
  ArrowLeftRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    transactions,
    people,
    settings,
    now,
    openGiveMoney,
    openRecordReturn,
    setActiveTab,
    setSelectedTransactionId,
    activities
  } = useAccounts();

  // Financial aggregates
  const dashboardStats = useMemo(() => {
    let totalCostTillDate = 0;
    let totalMoneyCurrentlyOutside = 0;
    let currentDailyCost = 0;
    let openTransactionsCount = 0;
    let overdueTransactionsCount = 0;
    let overdueAmount = 0;
    const peopleWithOutstandingSet = new Set<string>();

    for (const tx of transactions) {
      const breakdown = calculateTransactionCost(tx, now, settings.annualRate);

      const cost = breakdown.isClosed && tx.finalFinancingCost !== undefined
        ? tx.finalFinancingCost
        : breakdown.totalCost;
      totalCostTillDate += cost;

      if (!breakdown.isClosed && breakdown.outstanding > 0) {
        totalMoneyCurrentlyOutside += breakdown.outstanding;
        currentDailyCost += breakdown.dailyCost;
        openTransactionsCount++;
        peopleWithOutstandingSet.add(tx.personId);

        if (breakdown.status === 'Overdue') {
          overdueTransactionsCount++;
          overdueAmount += breakdown.outstanding;
        }
      }
    }

    const todayCost = calculateTodayFinancingCost(transactions, now, settings.annualRate);

    return {
      totalCostTillDate,
      totalMoneyCurrentlyOutside,
      currentDailyCost,
      todayFinancingCost: todayCost,
      peopleWithOutstandingCount: peopleWithOutstandingSet.size,
      openTransactionsCount,
      overdueTransactionsCount,
      overdueAmount
    };
  }, [transactions, now, settings.annualRate]);

  // Recent 4 transactions for quick glance
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(`${b.dateGiven}T${b.timeGiven || '00:00'}`).getTime() -
                      new Date(`${a.dateGiven}T${a.timeGiven || '00:00'}`).getTime())
      .slice(0, 4);
  }, [transactions]);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 1. HERO CARD: TOTAL FINANCING COST TILL DATE (Prominently displayed) */}
      <div className="hero-cost-card">
        <div className="hero-cost-label">
          <span>Total Financing Cost Till Date</span>
          <span className="hero-rate-tag">{settings.annualRate}% p.a.</span>
        </div>

        <div className="hero-cost-amount">
          <span>{formatCost(dashboardStats.totalCostTillDate)}</span>
          <span className="hero-pulse-dot" title="Live calculation ticking"></span>
        </div>

        <div className="hero-substats">
          <div className="hero-substat-item">
            <span className="hero-substat-label">Money Currently Outside</span>
            <span className="hero-substat-val">{formatINR(dashboardStats.totalMoneyCurrentlyOutside)}</span>
          </div>
          <div className="hero-substat-item">
            <span className="hero-substat-label">Current Daily Cost</span>
            <span className="hero-substat-val" style={{ color: '#38bdf8' }}>
              {formatCost(dashboardStats.currentDailyCost)}/day
            </span>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY ACTION BUTTONS: Give Money & Record Return */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <button
          type="button"
          className="btn btn-give"
          onClick={() => openGiveMoney()}
          style={{ boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)' }}
        >
          <PlusCircle size={18} />
          <span>Give Money</span>
        </button>

        <button
          type="button"
          className="btn btn-return"
          onClick={() => openRecordReturn()}
          style={{ boxShadow: '0 2px 8px rgba(4, 120, 87, 0.2)' }}
        >
          <ArrowDownLeft size={18} />
          <span>Record Return</span>
        </button>
      </div>

      {/* 3. COMPACT STATS GRID: Today's Cost, People Outside, Open Tx, Overdue */}
      <div className="stats-grid-2x2">
        {/* Today's Financing Cost */}
        <div className="compact-stat-card">
          <div className="stat-header">
            <span className="stat-label">Today's Financing Cost</span>
            <Clock size={15} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value" style={{ color: '#0f172a' }}>
            {formatCost(dashboardStats.todayFinancingCost)}
          </div>
          <div className="stat-subtext">Accumulated today</div>
        </div>

        {/* People With Outstanding Money */}
        <div
          className="compact-stat-card"
          onClick={() => setActiveTab('people')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <span className="stat-label">People Outside</span>
            <Users size={15} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-value">
            {dashboardStats.peopleWithOutstandingCount}
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>
              / {people.length}
            </span>
          </div>
          <div className="stat-subtext">Tap to view accounts</div>
        </div>

        {/* Open Transactions */}
        <div
          className="compact-stat-card"
          onClick={() => setActiveTab('transactions')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <span className="stat-label">Open Transactions</span>
            <ArrowLeftRight size={15} style={{ color: '#6366f1' }} />
          </div>
          <div className="stat-value">{dashboardStats.openTransactionsCount}</div>
          <div className="stat-subtext">Active khata entries</div>
        </div>

        {/* Overdue Card */}
        <div
          className={`compact-stat-card ${dashboardStats.overdueTransactionsCount > 0 ? 'alert' : ''}`}
          onClick={() => setActiveTab('overdue')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <span className="stat-label" style={{ color: dashboardStats.overdueTransactionsCount > 0 ? '#b91c1c' : 'inherit' }}>
              Overdue Amount
            </span>
            <AlertTriangle
              size={15}
              style={{ color: dashboardStats.overdueTransactionsCount > 0 ? '#ef4444' : 'var(--text-muted)' }}
            />
          </div>
          <div className={`stat-value ${dashboardStats.overdueTransactionsCount > 0 ? 'red' : ''}`}>
            {formatINR(dashboardStats.overdueAmount)}
          </div>
          <div className="stat-subtext" style={{ color: dashboardStats.overdueTransactionsCount > 0 ? '#b91c1c' : 'inherit' }}>
            {dashboardStats.overdueTransactionsCount} {dashboardStats.overdueTransactionsCount === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-title-wrap">
          <h3 className="section-title">Recent Transactions</h3>
          <button
            type="button"
            className="section-link"
            onClick={() => setActiveTab('transactions')}
          >
            View All ({transactions.length})
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-title">No transactions recorded</div>
            <div className="empty-desc">Tap "Give Money" above to create your first transaction.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTransactions.map((tx) => {
              const person = people.find((p) => p.id === tx.personId);
              const breakdown = calculateTransactionCost(tx, now, settings.annualRate);
              const statusClass = breakdown.status.toLowerCase().replace(/\s+/g, '-');

              return (
                <div
                  key={tx.id}
                  className="card"
                  onClick={() => setSelectedTransactionId(tx.id)}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                        {person?.name || 'Unknown'}
                      </span>
                      <span className={`status-badge ${statusClass}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                        {breakdown.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {tx.transactionNumber} • {formatDate(tx.dateGiven)} • {tx.remark}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatINR(breakdown.outstanding > 0 ? breakdown.outstanding : tx.amountGiven)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--primary-accent)', fontWeight: 700 }}>
                      +{formatCost(breakdown.isClosed && tx.finalFinancingCost !== undefined ? tx.finalFinancingCost : breakdown.totalCost)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. KHATA ACTIVITY FEED */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-title-wrap">
          <h3 className="section-title">Khata Activity Feed</h3>
        </div>

        {activities.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <div className="empty-desc">No recent activities.</div>
          </div>
        ) : (
          <div className="activity-list">
            {activities.slice(0, 6).map((act) => {
              const dotClass =
                act.type === 'GIVE_MONEY'
                  ? 'give'
                  : act.type === 'RETURN_MONEY'
                  ? 'return'
                  : 'closed';

              return (
                <div key={act.id} className="activity-item">
                  <div className={`activity-dot ${dotClass}`} />
                  <div className="activity-info">
                    <div className="activity-title">{act.title}</div>
                    <div className="activity-meta">
                      {act.transactionNumber} • {formatRelativeActivity(act.dateStr, act.timeStr)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
