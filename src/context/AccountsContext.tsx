import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Person, Transaction, AppSettings, ReturnRecord, EditRecord, ActivityItem } from '../types';
import { INITIAL_PEOPLE, INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from '../sampleData';
import { calculateTransactionCost, parseDateTime } from '../utils/calculator';

interface AccountsContextType {
  people: Person[];
  transactions: Transaction[];
  settings: AppSettings;
  now: Date;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPersonId: string | null;
  setSelectedPersonId: (id: string | null) => void;
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  giveMoneyModalOpen: boolean;
  setGiveMoneyModalOpen: (open: boolean) => void;
  recordReturnModalOpen: boolean;
  setRecordReturnModalOpen: (open: boolean) => void;
  addPersonModalOpen: boolean;
  setAddPersonModalOpen: (open: boolean) => void;
  modalPreselectedPersonId?: string;
  modalPreselectedTransactionId?: string;

  // Actions
  openGiveMoney: (personId?: string) => void;
  openRecordReturn: (transactionId?: string, personId?: string) => void;
  openAddPerson: () => void;
  addPerson: (name: string, mobileNumber: string) => Person;
  giveMoney: (data: {
    personId: string;
    amountGiven: number;
    dateGiven: string;
    timeGiven: string;
    expectedReturnDate: string;
    remark: string;
  }) => Transaction;
  recordReturn: (data: {
    transactionId: string;
    returnedAmount: number;
    returnDate: string;
    returnTime: string;
    remark?: string;
  }) => { success: boolean; error?: string };
  editTransaction: (
    transactionId: string,
    updates: {
      amountGiven?: number;
      dateGiven?: string;
      timeGiven?: string;
      expectedReturnDate?: string;
      remark?: string;
    },
    reason?: string
  ) => void;
  deleteTransaction: (transactionId: string) => void;
  deletePerson: (personId: string) => { success: boolean; error?: string };
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  exportBackup: () => void;
  importBackup: (jsonContent: string) => { success: boolean; error?: string };
  resetToSampleData: () => void;
  clearAllData: () => void;
  getPersonById: (id: string) => Person | undefined;
  getTransactionById: (id: string) => Transaction | undefined;
  activities: ActivityItem[];
}

const STORAGE_KEY_PEOPLE = 'armaan_accounts_people_v1';
const STORAGE_KEY_TRANSACTIONS = 'armaan_accounts_transactions_v1';
const STORAGE_KEY_SETTINGS = 'armaan_accounts_settings_v1';

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load data from localStorage or fallback to sample data
  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PEOPLE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load people from storage', e);
    }
    return INITIAL_PEOPLE;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load transactions from storage', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
    return INITIAL_SETTINGS;
  });

  // Navigation and selection state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Modals state
  const [giveMoneyModalOpen, setGiveMoneyModalOpen] = useState(false);
  const [recordReturnModalOpen, setRecordReturnModalOpen] = useState(false);
  const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
  const [modalPreselectedPersonId, setModalPreselectedPersonId] = useState<string | undefined>(undefined);
  const [modalPreselectedTransactionId, setModalPreselectedTransactionId] = useState<string | undefined>(undefined);

  // Live timer tick for real-time cost counter (every 1 second)
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
    } catch (e) {
      console.error('Failed to save people to storage', e);
    }
  }, [people]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to storage', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to storage', e);
    }
  }, [settings]);

  // Modal open helpers
  const openGiveMoney = useCallback((personId?: string) => {
    setModalPreselectedPersonId(personId);
    setGiveMoneyModalOpen(true);
  }, []);

  const openRecordReturn = useCallback((transactionId?: string, personId?: string) => {
    setModalPreselectedTransactionId(transactionId);
    setModalPreselectedPersonId(personId);
    setRecordReturnModalOpen(true);
  }, []);

  const openAddPerson = useCallback(() => {
    setAddPersonModalOpen(true);
  }, []);

  // Add person
  const addPerson = useCallback((name: string, mobileNumber: string): Person => {
    const newPerson: Person = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      createdAt: new Date().toISOString()
    };
    setPeople((prev) => [newPerson, ...prev]);
    return newPerson;
  }, []);

  // Generate next transaction number: AA000001
  const getNextTransactionNumber = useCallback((existingTx: Transaction[]): string => {
    let maxNum = 0;
    for (const tx of existingTx) {
      if (tx.transactionNumber && tx.transactionNumber.startsWith('AA')) {
        const numPart = parseInt(tx.transactionNumber.substring(2), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `AA${String(nextNum).padStart(6, '0')}`;
  }, []);

  // Give money
  const giveMoney = useCallback(
    (data: {
      personId: string;
      amountGiven: number;
      dateGiven: string;
      timeGiven: string;
      expectedReturnDate: string;
      remark: string;
    }): Transaction => {
      const txNum = getNextTransactionNumber(transactions);
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        transactionNumber: txNum,
        personId: data.personId,
        amountGiven: data.amountGiven,
        dateGiven: data.dateGiven,
        timeGiven: data.timeGiven || '12:00',
        expectedReturnDate: data.expectedReturnDate,
        remark: data.remark.trim() || 'Help / Advance',
        returns: [],
        status: 'Open',
        editHistory: [],
        createdAt: new Date().toISOString()
      };

      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    },
    [transactions, getNextTransactionNumber]
  );

  // Record return
  const recordReturn = useCallback(
    (data: {
      transactionId: string;
      returnedAmount: number;
      returnDate: string;
      returnTime: string;
      remark?: string;
    }): { success: boolean; error?: string } => {
      const targetTx = transactions.find((t) => t.id === data.transactionId);
      if (!targetTx) {
        return { success: false, error: 'Transaction not found.' };
      }

      if (data.returnedAmount <= 0) {
        return { success: false, error: 'Returned amount must be greater than zero.' };
      }

      // Check current outstanding
      const currentReturned = targetTx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
      const currentOutstanding = Math.max(0, targetTx.amountGiven - currentReturned);

      if (data.returnedAmount > currentOutstanding + 0.001) {
        return {
          success: false,
          error: `Returned amount cannot exceed the current outstanding balance of ₹${currentOutstanding.toLocaleString('en-IN')}.`
        };
      }

      // Check date and time
      const givenTime = parseDateTime(targetTx.dateGiven, targetTx.timeGiven);
      const returnTime = parseDateTime(data.returnDate, data.returnTime || '00:00');
      if (returnTime.getTime() < givenTime.getTime()) {
        return {
          success: false,
          error: 'Return date and time cannot be earlier than the date and time when money was given.'
        };
      }

      const newReturn: ReturnRecord = {
        id: `ret-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        returnedAmount: data.returnedAmount,
        returnDate: data.returnDate,
        returnTime: data.returnTime || '12:00',
        remark: data.remark?.trim(),
        createdAt: new Date().toISOString()
      };

      const updatedReturns = [...targetTx.returns, newReturn];
      const newTotalReturned = updatedReturns.reduce((sum, r) => sum + r.returnedAmount, 0);
      const newOutstanding = Math.max(0, targetTx.amountGiven - newTotalReturned);
      const isNowClosed = newOutstanding <= 0.001;

      let closedAt = targetTx.closedAt;
      let finalFinancingCost = targetTx.finalFinancingCost;

      if (isNowClosed) {
        closedAt = returnTime.toISOString();
        // Compute and freeze final financing cost
        const costResult = calculateTransactionCost(
          { ...targetTx, returns: updatedReturns },
          returnTime,
          settings.annualRate
        );
        finalFinancingCost = parseFloat(costResult.totalCost.toFixed(2));
      }

      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === targetTx.id) {
            return {
              ...t,
              returns: updatedReturns,
              status: isNowClosed ? 'Closed' : newTotalReturned > 0 ? 'Partially Repaid' : 'Open',
              closedAt,
              finalFinancingCost
            };
          }
          return t;
        })
      );

      return { success: true };
    },
    [transactions, settings.annualRate]
  );

  // Edit transaction with audit log
  const editTransaction = useCallback(
    (
      transactionId: string,
      updates: {
        amountGiven?: number;
        dateGiven?: string;
        timeGiven?: string;
        expectedReturnDate?: string;
        remark?: string;
      },
      reason?: string
    ) => {
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.id !== transactionId) return tx;

          const newEditRecords: EditRecord[] = [...(tx.editHistory || [])];
          const nowIso = new Date().toISOString();

          if (updates.amountGiven !== undefined && updates.amountGiven !== tx.amountGiven) {
            newEditRecords.push({
              id: `ed-${Date.now()}-amt`,
              field: 'Amount Given',
              oldValue: `₹${tx.amountGiven.toLocaleString('en-IN')}`,
              newValue: `₹${updates.amountGiven.toLocaleString('en-IN')}`,
              date: nowIso,
              reason
            });
          }

          if (updates.dateGiven !== undefined && updates.dateGiven !== tx.dateGiven) {
            newEditRecords.push({
              id: `ed-${Date.now()}-dg`,
              field: 'Date Given',
              oldValue: tx.dateGiven,
              newValue: updates.dateGiven,
              date: nowIso,
              reason
            });
          }

          if (updates.timeGiven !== undefined && updates.timeGiven !== tx.timeGiven) {
            newEditRecords.push({
              id: `ed-${Date.now()}-tg`,
              field: 'Time Given',
              oldValue: tx.timeGiven,
              newValue: updates.timeGiven,
              date: nowIso,
              reason
            });
          }

          if (updates.expectedReturnDate !== undefined && updates.expectedReturnDate !== tx.expectedReturnDate) {
            newEditRecords.push({
              id: `ed-${Date.now()}-erd`,
              field: 'Expected Return Date',
              oldValue: tx.expectedReturnDate,
              newValue: updates.expectedReturnDate,
              date: nowIso,
              reason
            });
          }

          if (updates.remark !== undefined && updates.remark !== tx.remark) {
            newEditRecords.push({
              id: `ed-${Date.now()}-rem`,
              field: 'Remark',
              oldValue: tx.remark,
              newValue: updates.remark,
              date: nowIso,
              reason
            });
          }

          const updatedTx: Transaction = {
            ...tx,
            amountGiven: updates.amountGiven ?? tx.amountGiven,
            dateGiven: updates.dateGiven ?? tx.dateGiven,
            timeGiven: updates.timeGiven ?? tx.timeGiven,
            expectedReturnDate: updates.expectedReturnDate ?? tx.expectedReturnDate,
            remark: updates.remark ?? tx.remark,
            editHistory: newEditRecords
          };

          // Re-evaluate closed status and final financing cost
          const currentReturned = updatedTx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
          const outstanding = Math.max(0, updatedTx.amountGiven - currentReturned);
          if (outstanding <= 0.001) {
            updatedTx.status = 'Closed';
            const costResult = calculateTransactionCost(updatedTx, new Date(), settings.annualRate);
            updatedTx.finalFinancingCost = parseFloat(costResult.totalCost.toFixed(2));
          } else {
            updatedTx.status = currentReturned > 0 ? 'Partially Repaid' : 'Open';
            updatedTx.closedAt = undefined;
            updatedTx.finalFinancingCost = undefined;
          }

          return updatedTx;
        })
      );
    },
    [settings.annualRate]
  );

  // Delete transaction
  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    if (selectedTransactionId === transactionId) {
      setSelectedTransactionId(null);
    }
  }, [selectedTransactionId]);

  // Delete person
  const deletePerson = useCallback(
    (personId: string): { success: boolean; error?: string } => {
      const hasTransactions = transactions.some((t) => t.personId === personId);
      if (hasTransactions) {
        return {
          success: false,
          error: 'Cannot delete person with existing transactions. Delete their transactions first or keep them in history.'
        };
      }
      setPeople((prev) => prev.filter((p) => p.id !== personId));
      if (selectedPersonId === personId) {
        setSelectedPersonId(null);
      }
      return { success: true };
    },
    [transactions, selectedPersonId]
  );

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Export Backup
  const exportBackup = useCallback(() => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Armaan Accounts',
      people,
      transactions,
      settings
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `armaan-accounts-backup-${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [people, transactions, settings]);

  // Import Backup
  const importBackup = useCallback(
    (jsonContent: string): { success: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed.people || !Array.isArray(parsed.people) || !parsed.transactions || !Array.isArray(parsed.transactions)) {
          return { success: false, error: 'Invalid backup file structure. Missing people or transactions array.' };
        }

        setPeople(parsed.people);
        setTransactions(parsed.transactions);
        if (parsed.settings) {
          setSettings(parsed.settings);
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to parse JSON backup file.' };
      }
    },
    []
  );

  // Reset to sample data
  const resetToSampleData = useCallback(() => {
    setPeople(INITIAL_PEOPLE);
    setTransactions(INITIAL_TRANSACTIONS);
    setSettings(INITIAL_SETTINGS);
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    setPeople([]);
    setTransactions([]);
  }, []);

  const getPersonById = useCallback((id: string) => people.find((p) => p.id === id), [people]);
  const getTransactionById = useCallback((id: string) => transactions.find((t) => t.id === id), [transactions]);

  // Generate Khata Activity Feed
  const activities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];

    for (const tx of transactions) {
      const person = people.find((p) => p.id === tx.personId);
      const personName = person ? person.name : 'Unknown';

      // 1. Give money activity
      list.push({
        id: `act-give-${tx.id}`,
        type: 'GIVE_MONEY',
        title: `₹${tx.amountGiven.toLocaleString('en-IN')} Given to ${personName}`,
        personName,
        amount: tx.amountGiven,
        transactionNumber: tx.transactionNumber,
        timestamp: `${tx.dateGiven}T${tx.timeGiven || '00:00'}:00`,
        dateStr: tx.dateGiven,
        timeStr: tx.timeGiven
      });

      // 2. Returns activities
      for (const ret of tx.returns) {
        list.push({
          id: `act-ret-${ret.id}`,
          type: 'RETURN_MONEY',
          title: `₹${ret.returnedAmount.toLocaleString('en-IN')} Returned by ${personName}`,
          personName,
          amount: ret.returnedAmount,
          transactionNumber: tx.transactionNumber,
          timestamp: `${ret.returnDate}T${ret.returnTime || '00:00'}:00`,
          dateStr: ret.returnDate,
          timeStr: ret.returnTime
        });
      }

      // 3. Closed activity if closed
      if (tx.status === 'Closed' && tx.closedAt) {
        const closedDate = tx.closedAt.split('T')[0];
        const closedTime = tx.closedAt.split('T')[1]?.substring(0, 5);
        list.push({
          id: `act-closed-${tx.id}`,
          type: 'TRANSACTION_CLOSED',
          title: `Transaction ${tx.transactionNumber} Closed`,
          personName,
          transactionNumber: tx.transactionNumber,
          timestamp: tx.closedAt,
          dateStr: closedDate,
          timeStr: closedTime
        });
      }
    }

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, people]);

  return (
    <AccountsContext.Provider
      value={{
        people,
        transactions,
        settings,
        now,
        activeTab,
        setActiveTab,
        selectedPersonId,
        setSelectedPersonId,
        selectedTransactionId,
        setSelectedTransactionId,
        giveMoneyModalOpen,
        setGiveMoneyModalOpen,
        recordReturnModalOpen,
        setRecordReturnModalOpen,
        addPersonModalOpen,
        setAddPersonModalOpen,
        modalPreselectedPersonId,
        modalPreselectedTransactionId,
        openGiveMoney,
        openRecordReturn,
        openAddPerson,
        addPerson,
        giveMoney,
        recordReturn,
        editTransaction,
        deleteTransaction,
        deletePerson,
        updateSettings,
        exportBackup,
        importBackup,
        resetToSampleData,
        clearAllData,
        getPersonById,
        getTransactionById,
        activities
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};
