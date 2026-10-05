import type { Person, Transaction, AppSettings } from './types';

export const INITIAL_SETTINGS: AppSettings = {
  appName: 'Armaan Accounts',
  annualRate: 17.5,
  currency: 'INR',
  timezone: 'India'
};

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: 'Ramesh Kumar',
    mobileNumber: '9876543210',
    createdAt: '2026-09-15T10:00:00.000Z'
  },
  {
    id: 'p-2',
    name: 'Suresh Sharma',
    mobileNumber: '9812345678',
    createdAt: '2026-08-10T09:30:00.000Z'
  },
  {
    id: 'p-3',
    name: 'Priya Patel',
    mobileNumber: '9765432109',
    createdAt: '2026-09-01T11:00:00.000Z'
  },
  {
    id: 'p-4',
    name: 'Amit Verma',
    mobileNumber: '9988776655',
    createdAt: '2026-09-20T14:30:00.000Z'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    transactionNumber: 'AA000001',
    personId: 'p-1',
    amountGiven: 60000,
    dateGiven: '2026-09-15',
    timeGiven: '16:00',
    expectedReturnDate: '2026-10-20',
    remark: 'Medical Help',
    returns: [
      {
        id: 'ret-1-1',
        returnedAmount: 10000,
        returnDate: '2026-09-22',
        returnTime: '10:00',
        remark: 'First installment',
        createdAt: '2026-09-22T10:00:00.000Z'
      },
      {
        id: 'ret-1-2',
        returnedAmount: 20000,
        returnDate: '2026-09-30',
        returnTime: '14:30',
        remark: 'Second installment',
        createdAt: '2026-09-30T14:30:00.000Z'
      }
    ],
    status: 'Partially Repaid',
    editHistory: [],
    createdAt: '2026-09-15T16:00:00.000Z'
  },
  {
    id: 'tx-2',
    transactionNumber: 'AA000002',
    personId: 'p-1',
    amountGiven: 20000,
    dateGiven: '2026-10-01',
    timeGiven: '11:30',
    expectedReturnDate: '2026-10-25',
    remark: 'Emergency Advance',
    returns: [],
    status: 'Open',
    editHistory: [],
    createdAt: '2026-10-01T11:30:00.000Z'
  },
  {
    id: 'tx-3',
    transactionNumber: 'AA000003',
    personId: 'p-2',
    amountGiven: 50000,
    dateGiven: '2026-08-10',
    timeGiven: '10:00',
    expectedReturnDate: '2026-09-10', // Overdue
    remark: 'Shop Renovation Help',
    returns: [
      {
        id: 'ret-3-1',
        returnedAmount: 10000,
        returnDate: '2026-08-25',
        returnTime: '15:30',
        remark: 'Partial return by UPI',
        createdAt: '2026-08-25T15:30:00.000Z'
      }
    ],
    status: 'Overdue',
    editHistory: [],
    createdAt: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 'tx-4',
    transactionNumber: 'AA000004',
    personId: 'p-3',
    amountGiven: 30000,
    dateGiven: '2026-09-01',
    timeGiven: '12:00',
    expectedReturnDate: '2026-09-25',
    remark: 'Temporary Help',
    returns: [
      {
        id: 'ret-4-1',
        returnedAmount: 30000,
        returnDate: '2026-09-28',
        returnTime: '17:00',
        remark: 'Full repayment in cash',
        createdAt: '2026-09-28T17:00:00.000Z'
      }
    ],
    status: 'Closed',
    closedAt: '2026-09-28T17:00:00.000Z',
    finalFinancingCost: 388.36,
    editHistory: [],
    createdAt: '2026-09-01T12:00:00.000Z'
  },
  {
    id: 'tx-5',
    transactionNumber: 'AA000005',
    personId: 'p-4',
    amountGiven: 100000,
    dateGiven: '2026-09-20',
    timeGiven: '15:00',
    expectedReturnDate: '2026-10-30',
    remark: 'Personal Need',
    returns: [],
    status: 'Open',
    editHistory: [],
    createdAt: '2026-09-20T15:00:00.000Z'
  }
];
