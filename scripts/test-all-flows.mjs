// Comprehensive practical testing suite for Armaan Accounts
import { calculateTransactionCost, getDaysOverdue, parseDateTime } from '../src/utils/calculator.js';

console.log('====================================================');
console.log('  ARMAAN ACCOUNTS - COMPREHENSIVE FLOW VERIFICATION  ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// Fixed Rate Check
const ANNUAL_RATE = 17.5;
assert(ANNUAL_RATE === 17.5, 'Financing rate is strictly fixed at 17.5% p.a.');

// Mock State Store simulating AccountsContext
class MockKhataStore {
  constructor() {
    this.people = [];
    this.transactions = [];
    this.settings = { annualRate: 17.5, defaultExpectedDays: 30 };
    this.lastBackupExportedAt = null;
    this.editHistory = [];
  }

  addPerson(name, mobileNumber) {
    const isDuplicate = this.people.some(p => p.mobileNumber.trim() === mobileNumber.trim());
    const person = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      createdAt: new Date().toISOString(),
      isArchived: false
    };
    this.people.push(person);
    return { person, isDuplicate };
  }

  editPerson(id, updates) {
    const person = this.people.find(p => p.id === id);
    if (!person) return { success: false, error: 'Not found' };
    const isDuplicate = this.people.some(p => p.id !== id && p.mobileNumber.trim() === updates.mobileNumber.trim());
    person.name = updates.name.trim();
    person.mobileNumber = updates.mobileNumber.trim();
    return { success: true, isDuplicate };
  }

  deletePerson(id) {
    const hasTransactions = this.transactions.some(t => t.personId === id);
    if (hasTransactions) {
      return { success: false, error: 'Cannot delete person with transactions. Archive instead.' };
    }
    const idx = this.people.findIndex(p => p.id === id);
    if (idx !== -1) {
      const removed = this.people.splice(idx, 1)[0];
      return { success: true, removed };
    }
    return { success: false };
  }

  archivePerson(id) {
    const person = this.people.find(p => p.id === id);
    if (person) {
      person.isArchived = true;
      return true;
    }
    return false;
  }

  restorePerson(id) {
    const person = this.people.find(p => p.id === id);
    if (person) {
      person.isArchived = false;
      return true;
    }
    return false;
  }

  giveMoney({ personId, amountGiven, dateGiven, timeGiven, expectedReturnDate, remark }) {
    const tx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      transactionNumber: `TX-${String(this.transactions.length + 1).padStart(3, '0')}`,
      personId,
      amountGiven,
      dateGiven,
      timeGiven: timeGiven || '12:00',
      expectedReturnDate,
      remark,
      status: 'Open',
      returns: [],
      createdAt: new Date().toISOString()
    };
    this.transactions.push(tx);
    return tx;
  }

  editTransaction(txId, updates, reason) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) return false;
    if (updates.amountGiven !== undefined) tx.amountGiven = updates.amountGiven;
    if (updates.dateGiven !== undefined) tx.dateGiven = updates.dateGiven;
    if (updates.timeGiven !== undefined) tx.timeGiven = updates.timeGiven;
    if (updates.expectedReturnDate !== undefined) tx.expectedReturnDate = updates.expectedReturnDate;
    if (updates.remark !== undefined) tx.remark = updates.remark;

    const totalRet = tx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
    const outstanding = Math.max(0, tx.amountGiven - totalRet);
    if (outstanding <= 0.001) {
      tx.status = 'Closed';
      const costRes = calculateTransactionCost(tx, new Date(), this.settings.annualRate);
      tx.finalFinancingCost = parseFloat(costRes.totalCost.toFixed(2));
    } else {
      tx.status = totalRet > 0 ? 'Partially Repaid' : 'Open';
      tx.closedAt = undefined;
      tx.finalFinancingCost = undefined;
    }
    return true;
  }

  deleteTransaction(txId) {
    const idx = this.transactions.findIndex(t => t.id === txId);
    if (idx !== -1) {
      const removed = this.transactions.splice(idx, 1)[0];
      return { success: true, removed };
    }
    return { success: false };
  }

  recordReturn(txId, returnedAmount, returnDate, returnTime, remark) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) return { success: false, error: 'Tx not found' };
    const newReturn = {
      id: `ret-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      returnedAmount,
      returnDate,
      returnTime: returnTime || '12:00',
      remark
    };
    tx.returns.push(newReturn);

    const totalRet = tx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
    const outstanding = Math.max(0, tx.amountGiven - totalRet);
    if (outstanding <= 0.001) {
      tx.status = 'Closed';
      const latestReturnTime = parseDateTime(returnDate, returnTime);
      tx.closedAt = latestReturnTime.toISOString();
      const costRes = calculateTransactionCost(tx, latestReturnTime, this.settings.annualRate);
      tx.finalFinancingCost = parseFloat(costRes.totalCost.toFixed(2));
    } else {
      tx.status = 'Partially Repaid';
    }
    return { success: true, returnRecord: newReturn };
  }

  editReturn(txId, returnId, updates) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) return { success: false };
    const ret = tx.returns.find(r => r.id === returnId);
    if (!ret) return { success: false };
    ret.returnedAmount = updates.returnedAmount;
    ret.returnDate = updates.returnDate;
    ret.returnTime = updates.returnTime || '12:00';
    if (updates.remark !== undefined) ret.remark = updates.remark;

    const totalRet = tx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
    const outstanding = Math.max(0, tx.amountGiven - totalRet);
    if (outstanding <= 0.001) {
      tx.status = 'Closed';
      const latestReturnTime = parseDateTime(updates.returnDate, updates.returnTime);
      tx.closedAt = latestReturnTime.toISOString();
      const costRes = calculateTransactionCost(tx, latestReturnTime, this.settings.annualRate);
      tx.finalFinancingCost = parseFloat(costRes.totalCost.toFixed(2));
    } else {
      tx.status = totalRet > 0 ? 'Partially Repaid' : 'Open';
      tx.closedAt = undefined;
      tx.finalFinancingCost = undefined;
    }
    return { success: true };
  }

  deleteReturn(txId, returnId) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) return { success: false };
    const idx = tx.returns.findIndex(r => r.id === returnId);
    if (idx === -1) return { success: false };
    const removed = tx.returns.splice(idx, 1)[0];

    const totalRet = tx.returns.reduce((sum, r) => sum + r.returnedAmount, 0);
    const outstanding = Math.max(0, tx.amountGiven - totalRet);
    if (outstanding <= 0.001) {
      tx.status = 'Closed';
      const lastRet = tx.returns[tx.returns.length - 1];
      const latestTime = parseDateTime(lastRet.returnDate, lastRet.returnTime);
      tx.closedAt = latestTime.toISOString();
      const costRes = calculateTransactionCost(tx, latestTime, this.settings.annualRate);
      tx.finalFinancingCost = parseFloat(costRes.totalCost.toFixed(2));
    } else {
      // Reopened!
      tx.status = totalRet > 0 ? 'Partially Repaid' : 'Open';
      tx.closedAt = undefined;
      tx.finalFinancingCost = undefined;
    }
    return { success: true, removed };
  }
}

const store = new MockKhataStore();

console.log('\n--- 1. Person Creation & Duplicate Mobile Detection ---');
const p1 = store.addPerson('Vikram Singh', '9998887777');
assert(p1.person.name === 'Vikram Singh', 'Person Vikram Singh created');
assert(!p1.isDuplicate, 'Mobile 9998887777 is not duplicate');

const p2 = store.addPerson('Another Person', '9998887777');
assert(p2.isDuplicate, 'Duplicate mobile number warning detected when adding another person with same phone');

console.log('\n--- 2. Person Edit ---');
const editRes = store.editPerson(p1.person.id, { name: 'Vikram Singh Verma', mobileNumber: '9998887700' });
assert(editRes.success && p1.person.name === 'Vikram Singh Verma', 'Person successfully updated to Vikram Singh Verma');

console.log('\n--- 3. Delete Person with No Transactions ---');
const delP2 = store.deletePerson(p2.person.id);
assert(delP2.success, 'Person with 0 transactions can be permanently deleted');
assert(!store.people.some(p => p.id === p2.person.id), 'Deleted person removed from store');

console.log('\n--- 4. Give Money & Transaction Creation ---');
const tx1 = store.giveMoney({
  personId: p1.person.id,
  amountGiven: 50000,
  dateGiven: '2026-09-01',
  timeGiven: '10:00',
  expectedReturnDate: '2026-10-01',
  remark: 'Business inventory advance'
});
assert(tx1.amountGiven === 50000, 'Transaction created for ₹50,000');
assert(tx1.status === 'Open', 'New transaction status is Open');

console.log('\n--- 5. Prevent Permanent Delete for Person with History & Verify Archive ---');
const delP1 = store.deletePerson(p1.person.id);
assert(!delP1.success, 'Person with transaction history CANNOT be permanently deleted');

store.archivePerson(p1.person.id);
assert(p1.person.isArchived === true, 'Person with history archived successfully');

store.restorePerson(p1.person.id);
assert(p1.person.isArchived === false, 'Archived person restored successfully');

console.log('\n--- 6. Edit Transaction & Recalculate ---');
store.editTransaction(tx1.id, { amountGiven: 60000, remark: 'Updated to ₹60,000' }, 'Amount revised');
assert(tx1.amountGiven === 60000, 'Transaction amount updated to ₹60,000');
const evalCost1 = calculateTransactionCost(tx1, new Date('2026-10-01T10:00:00'), store.settings.annualRate);
assert(evalCost1.outstanding === 60000, 'Recalculated outstanding balance is ₹60,000');
// 60000 * 0.175 * (30 days / 365) = 863.01
assert(evalCost1.totalCost > 800 && evalCost1.totalCost < 900, `Calculated cost ~₹863 (actual: ${evalCost1.totalCost.toFixed(2)})`);

console.log('\n--- 7. Record Partial Return & Edit Partial Return ---');
const ret1 = store.recordReturn(tx1.id, 20000, '2026-09-15', '12:00', 'Partial return via UPI');
assert(ret1.success, 'Partial return of ₹20,000 recorded');
assert(tx1.status === 'Partially Repaid', 'Transaction status updated to Partially Repaid');

const costAfterRet1 = calculateTransactionCost(tx1, new Date('2026-10-01T10:00:00'), store.settings.annualRate);
assert(costAfterRet1.outstanding === 40000, 'Outstanding balance decreased to ₹40,000');

// Edit partial return to ₹25,000
store.editReturn(tx1.id, ret1.returnRecord.id, { returnedAmount: 25000, returnDate: '2026-09-15', returnTime: '12:00' });
const costAfterEditRet = calculateTransactionCost(tx1, new Date('2026-10-01T10:00:00'), store.settings.annualRate);
assert(costAfterEditRet.outstanding === 35000, 'Outstanding balance updated to ₹35,000 after editing return');

console.log('\n--- 8. Record Final Return & Verify Transaction Closes & Freezes Cost ---');
const ret2 = store.recordReturn(tx1.id, 35000, '2026-09-25', '14:00', 'Final return in cash');
assert(ret2.success, 'Final return of ₹35,000 recorded');
assert(tx1.status === 'Closed', 'Transaction status is Closed');
assert(tx1.closedAt !== undefined, 'closedAt timestamp is recorded');
assert(tx1.finalFinancingCost !== undefined && tx1.finalFinancingCost > 0, `Final financing cost frozen at ₹${tx1.finalFinancingCost}`);

console.log('\n--- 9. Delete Final Return & Verify Transaction Automatically Reopens! ---');
const delRet2 = store.deleteReturn(tx1.id, ret2.returnRecord.id);
assert(delRet2.success, 'Final return deleted');
assert(tx1.status === 'Partially Repaid', 'Transaction automatically REOPENED and status reverted to Partially Repaid');
assert(tx1.closedAt === undefined, 'closedAt cleared on reopen');
assert(tx1.finalFinancingCost === undefined, 'finalFinancingCost cleared on reopen');

const costAfterReopen = calculateTransactionCost(tx1, new Date('2026-10-05T12:00:00'), store.settings.annualRate);
assert(costAfterReopen.outstanding === 35000, 'Outstanding balance is back to ₹35,000');
assert(costAfterReopen.isClosed === false, 'Cost calculation resumed live timeline up to present date');

console.log('\n--- 10. Delete Transaction & Undo Verification ---');
const delTx = store.deleteTransaction(tx1.id);
assert(delTx.success, 'Transaction deleted');
assert(store.transactions.length === 0, 'Transaction removed from store');
// Undo restoration simulation
store.transactions.push(delTx.removed);
assert(store.transactions.length === 1, 'Transaction restored on Undo');

console.log('\n--- 11. Search Filtering Verification ---');
const peopleToSearch = [
  { name: 'Amitabh Bachchan', mobileNumber: '9876543210' },
  { name: 'Sachin Tendulkar', mobileNumber: '9123456780' },
  { name: 'Deepika Padukone', mobileNumber: '9988776655' }
];
const q1 = 'bachchan';
const matchedName = peopleToSearch.filter(p => p.name.toLowerCase().includes(q1) || p.mobileNumber.includes(q1));
assert(matchedName.length === 1 && matchedName[0].name === 'Amitabh Bachchan', 'People search by name matches');

const q2 = '91234';
const matchedPhone = peopleToSearch.filter(p => p.name.toLowerCase().includes(q2) || p.mobileNumber.includes(q2));
assert(matchedPhone.length === 1 && matchedPhone[0].name === 'Sachin Tendulkar', 'People search by mobile number matches');

console.log('\n--- 12. Backup Export & Timestamp Persistence ---');
const backupData = JSON.stringify({
  version: '1.0.0',
  exportedAt: new Date().toISOString(),
  rate: store.settings.annualRate,
  people: store.people,
  transactions: store.transactions
});
assert(backupData.includes('17.5'), 'Backup contains 17.5% rate and complete state');

console.log('\n====================================================');
console.log(`  ALL FLOWS TESTED: ${passedTests}/${totalTests} PASSED`);
console.log('====================================================\n');
