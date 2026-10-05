import React from 'react';
import { AccountsProvider, useAccounts } from './context/AccountsContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { PeoplePage } from './pages/PeoplePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { OverduePage } from './pages/OverduePage';
import { MorePage } from './pages/MorePage';
import { PersonDetailView } from './components/PersonDetailView';
import { GiveMoneyModal } from './components/modals/GiveMoneyModal';
import { RecordReturnModal } from './components/modals/RecordReturnModal';
import { AddPersonModal } from './components/modals/AddPersonModal';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';

const MainAppContent: React.FC = () => {
  const { activeTab, selectedPersonId } = useAccounts();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Armaan Accounts';
      case 'people':
        return 'People Accounts';
      case 'transactions':
        return 'All Transactions';
      case 'overdue':
        return 'Overdue Money';
      case 'more':
        return 'Reports & More';
      default:
        return 'Armaan Accounts';
    }
  };

  return (
    <div className="app-container">
      {/* If viewing a person detail, that component renders its own header with back button */}
      {!selectedPersonId && <Header title={getPageTitle()} />}

      <main className="app-main">
        {selectedPersonId ? (
          <PersonDetailView />
        ) : (
          <>
            {activeTab === 'home' && <DashboardPage />}
            {activeTab === 'people' && <PeoplePage />}
            {activeTab === 'transactions' && <TransactionsPage />}
            {activeTab === 'overdue' && <OverduePage />}
            {activeTab === 'more' && <MorePage />}
          </>
        )}
      </main>

      <BottomNav />

      {/* Global Modals & Bottom Sheets */}
      <GiveMoneyModal />
      <RecordReturnModal />
      <AddPersonModal />
      <TransactionDetailModal />
    </div>
  );
};

export function App() {
  return (
    <AccountsProvider>
      <MainAppContent />
    </AccountsProvider>
  );
}

export default App;
