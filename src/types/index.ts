export interface Person {
  id: string;
  name: string;
  mobileNumber: string;
  createdAt: string; // ISO string
}

export interface ReturnRecord {
  id: string;
  returnedAmount: number;
  returnDate: string; // YYYY-MM-DD
  returnTime: string; // HH:mm
  remark?: string;
  createdAt: string; // ISO string
}

export interface EditRecord {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  date: string; // ISO string
  reason?: string;
}

export type TransactionStatus = 'Open' | 'Partially Repaid' | 'Closed' | 'Overdue';

export interface Transaction {
  id: string;
  transactionNumber: string; // e.g. AA000001
  personId: string;
  amountGiven: number;
  dateGiven: string; // YYYY-MM-DD
  timeGiven: string; // HH:mm
  expectedReturnDate: string; // YYYY-MM-DD
  remark: string;
  returns: ReturnRecord[];
  status: TransactionStatus;
  closedAt?: string; // ISO string of final return
  finalFinancingCost?: number;
  editHistory: EditRecord[];
  createdAt: string; // ISO string
}

export interface AppSettings {
  appName: string;
  annualRate: number; // e.g. 17.5
  currency: string; // INR
  timezone: string; // India
}

export interface CostSegment {
  startDate: Date;
  endDate: Date;
  principal: number;
  elapsedHours: number;
  cost: number;
  description: string;
}

export interface TransactionCostBreakdown {
  totalCost: number;
  dailyCost: number;
  outstanding: number;
  totalReturned: number;
  isClosed: boolean;
  status: TransactionStatus;
  segments: CostSegment[];
}

export interface ActivityItem {
  id: string;
  type: 'GIVE_MONEY' | 'RETURN_MONEY' | 'TRANSACTION_CLOSED';
  title: string;
  personName: string;
  amount?: number;
  transactionNumber: string;
  timestamp: string; // ISO string
  dateStr: string;
  timeStr: string;
}
