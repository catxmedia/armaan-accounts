import React, { useMemo } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { Home, Users, ArrowLeftRight, AlertCircle, MoreHorizontal } from 'lucide-react';
import { getTransactionStatus } from '../utils/calculator';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, transactions, now, setSelectedPersonId, setSelectedTransactionId } = useAccounts();

  // Count overdue transactions
  const overdueCount = useMemo(() => {
    return transactions.filter((t) => {
      const returned = t.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
      const status = getTransactionStatus(t.amountGiven, returned, t.expectedReturnDate, now);
      return status === 'Overdue';
    }).length;
  }, [transactions, now]);

  const handleNav = (tabId: string) => {
    setSelectedPersonId(null);
    setSelectedTransactionId(null);
    setActiveTab(tabId);
  };

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => handleNav('home')}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'people' ? 'active' : ''}`}
        onClick={() => handleNav('people')}
      >
        <Users size={20} />
        <span>People</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
        onClick={() => handleNav('transactions')}
      >
        <ArrowLeftRight size={20} />
        <span>Transactions</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'overdue' ? 'active' : ''}`}
        onClick={() => handleNav('overdue')}
      >
        <AlertCircle size={20} />
        <span>Overdue</span>
        {overdueCount > 0 && <span className="nav-badge">{overdueCount}</span>}
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'more' ? 'active' : ''}`}
        onClick={() => handleNav('more')}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};
