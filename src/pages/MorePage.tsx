import React, { useState, useMemo, useRef } from 'react';
import { useAccounts } from '../context/AccountsContext';
import {
  Download,
  Upload,
  Settings as SettingsIcon,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle
} from 'lucide-react';
import { formatINR, formatCost } from '../utils/formatters';
import { calculateTransactionCost } from '../utils/calculator';

export const MorePage: React.FC = () => {
  const {
    people,
    transactions,
    settings,
    now,
    exportBackup,
    importBackup,
    lastBackupExportedAt,
    resetToSampleData,
    clearAllData,
    setSelectedPersonId,
    setConfirmDialog
  } = useAccounts();

  const [subTab, setSubTab] = useState<'reports' | 'backup' | 'settings'>('reports');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute Reports Data
  const reportsData = useMemo(() => {
    let totalGiven = 0;
    let totalReturned = 0;
    let currentOutstanding = 0;
    let totalFinancingCost = 0;
    let currentDailyCost = 0;
    let overdueOutstanding = 0;

    // Person-wise aggregations
    const personMap = new Map<string, {
      name: string;
      mobile: string;
      given: number;
      returned: number;
      outstanding: number;
      cost: number;
      dailyCost: number;
    }>();

    // Monthly aggregations (by dateGiven YYYY-MM)
    const monthlyMap = new Map<string, {
      monthLabel: string;
      given: number;
      cost: number;
      count: number;
    }>();

    for (const p of people) {
      personMap.set(p.id, {
        name: p.name,
        mobile: p.mobileNumber,
        given: 0,
        returned: 0,
        outstanding: 0,
        cost: 0,
        dailyCost: 0
      });
    }

    for (const tx of transactions) {
      const breakdown = calculateTransactionCost(tx, now, settings.annualRate);
      totalGiven += tx.amountGiven;
      totalReturned += breakdown.totalReturned;
      currentOutstanding += breakdown.outstanding;
      currentDailyCost += breakdown.dailyCost;

      const txCost = breakdown.isClosed && tx.finalFinancingCost !== undefined
        ? tx.finalFinancingCost
        : breakdown.totalCost;
      totalFinancingCost += txCost;

      if (breakdown.status === 'Overdue') {
        overdueOutstanding += breakdown.outstanding;
      }

      // Person aggregation
      const pEntry = personMap.get(tx.personId);
      if (pEntry) {
        pEntry.given += tx.amountGiven;
        pEntry.returned += breakdown.totalReturned;
        pEntry.outstanding += breakdown.outstanding;
        pEntry.cost += txCost;
        pEntry.dailyCost += breakdown.dailyCost;
      }

      // Month aggregation
      if (tx.dateGiven) {
        const monthKey = tx.dateGiven.substring(0, 7); // YYYY-MM
        const [year, month] = monthKey.split('-');
        const monthDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const monthLabel = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

        const existing = monthlyMap.get(monthKey) || {
          monthLabel,
          given: 0,
          cost: 0,
          count: 0
        };
        existing.given += tx.amountGiven;
        existing.cost += txCost;
        existing.count += 1;
        monthlyMap.set(monthKey, existing);
      }
    }

    const personWise = Array.from(personMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cost - a.cost);

    const monthlyWise = Array.from(monthlyMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => ({ key, ...data }));

    return {
      totalGiven,
      totalReturned,
      currentOutstanding,
      totalFinancingCost,
      currentDailyCost,
      overdueOutstanding,
      personWise,
      monthlyWise
    };
  }, [people, transactions, now, settings.annualRate]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction Number',
      'Person Name',
      'Mobile Number',
      'Amount Given (INR)',
      'Date Given',
      'Time Given',
      'Expected Return Date',
      'Status',
      'Total Returned (INR)',
      'Current Outstanding (INR)',
      'Financing Cost (INR)',
      'Daily Cost (INR)',
      'Remark'
    ];

    const rows = transactions.map((tx) => {
      const person = people.find((p) => p.id === tx.personId);
      const breakdown = calculateTransactionCost(tx, now, settings.annualRate);
      const cost = breakdown.isClosed && tx.finalFinancingCost !== undefined
        ? tx.finalFinancingCost
        : breakdown.totalCost;

      return [
        `"${tx.transactionNumber}"`,
        `"${person?.name || 'Unknown'}"`,
        `"${person?.mobileNumber || ''}"`,
        tx.amountGiven,
        `"${tx.dateGiven}"`,
        `"${tx.timeGiven}"`,
        `"${tx.expectedReturnDate || ''}"`,
        `"${breakdown.status}"`,
        breakdown.totalReturned,
        breakdown.outstanding,
        cost.toFixed(2),
        breakdown.dailyCost.toFixed(2),
        `"${(tx.remark || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `armaan-accounts-report-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setConfirmDialog({
        isOpen: true,
        title: 'Restore Backup',
        message: 'Are you sure you want to restore this backup file?',
        warningNote: 'Restoring will replace all people, transactions, and settings stored in this browser with data from the backup file.',
        confirmText: 'Restore Backup',
        danger: true,
        onConfirm: () => {
          const res = importBackup(text);
          if (res.success) {
            setImportStatus({ success: true, message: 'Backup restored successfully!' });
          } else {
            setImportStatus({ success: false, message: res.error || 'Failed to import backup file.' });
          }
        }
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Sub-navigation tabs: Reports, Backup, Settings */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          background: 'var(--bg-card)',
          borderRadius: 12,
          padding: 4,
          border: '1px solid var(--border-light)',
          marginBottom: 16
        }}
      >
        <button
          type="button"
          className={`filter-pill ${subTab === 'reports' ? 'active' : ''}`}
          onClick={() => setSubTab('reports')}
          style={{ borderRadius: 8, padding: '8px 0', textAlign: 'center' }}
        >
          Reports
        </button>
        <button
          type="button"
          className={`filter-pill ${subTab === 'backup' ? 'active' : ''}`}
          onClick={() => setSubTab('backup')}
          style={{ borderRadius: 8, padding: '8px 0', textAlign: 'center' }}
        >
          Backup
        </button>
        <button
          type="button"
          className={`filter-pill ${subTab === 'settings' ? 'active' : ''}`}
          onClick={() => setSubTab('settings')}
          style={{ borderRadius: 8, padding: '8px 0', textAlign: 'center' }}
        >
          Settings
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {subTab === 'reports' && (
        <div>
          {/* Header Action: Export CSV */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="section-title">Financial Summary</h3>
            <button
              type="button"
              className="btn-sm btn-secondary"
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
            >
              <FileSpreadsheet size={15} style={{ color: '#047857' }} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="stats-grid-2x2">
            <div className="compact-stat-card">
              <div className="stat-label">Total Money Given</div>
              <div className="stat-value">{formatINR(reportsData.totalGiven)}</div>
              <div className="stat-subtext">Across all entries</div>
            </div>

            <div className="compact-stat-card">
              <div className="stat-label">Total Money Returned</div>
              <div className="stat-value" style={{ color: '#047857' }}>
                {formatINR(reportsData.totalReturned)}
              </div>
              <div className="stat-subtext">Received back</div>
            </div>

            <div className="compact-stat-card">
              <div className="stat-label">Current Outstanding</div>
              <div className="stat-value" style={{ color: reportsData.currentOutstanding > 0 ? '#b91c1c' : 'inherit' }}>
                {formatINR(reportsData.currentOutstanding)}
              </div>
              <div className="stat-subtext">Currently outside</div>
            </div>

            <div className="compact-stat-card" style={{ background: '#f8fafc' }}>
              <div className="stat-label">Total Financing Cost</div>
              <div className="stat-value" style={{ color: 'var(--primary-accent)' }}>
                {formatCost(reportsData.totalFinancingCost)}
              </div>
              <div className="stat-subtext">At {settings.annualRate}% p.a.</div>
            </div>

            <div className="compact-stat-card">
              <div className="stat-label">Current Daily Cost</div>
              <div className="stat-value" style={{ color: '#38bdf8' }}>
                {formatCost(reportsData.currentDailyCost)}/day
              </div>
              <div className="stat-subtext">Generated per day</div>
            </div>

            <div className={`compact-stat-card ${reportsData.overdueOutstanding > 0 ? 'alert' : ''}`}>
              <div className="stat-label">Overdue Outstanding</div>
              <div className={`stat-value ${reportsData.overdueOutstanding > 0 ? 'red' : ''}`}>
                {formatINR(reportsData.overdueOutstanding)}
              </div>
              <div className="stat-subtext">Past due date</div>
            </div>
          </div>

          {/* Person-wise Financing Cost Section */}
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Person-Wise Financing Cost
            </h4>

            {reportsData.personWise.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No people accounts yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reportsData.personWise.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPersonId(p.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Given: {formatINR(p.given)} • Outstanding: <b style={{ color: p.outstanding > 0 ? '#b91c1c' : '#047857' }}>{formatINR(p.outstanding)}</b>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary-accent)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCost(p.cost)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {p.dailyCost > 0 ? `${formatCost(p.dailyCost)}/day` : 'Settled'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Breakdown */}
          <div className="card" style={{ padding: 14 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Monthly Given & Cost Breakdown
            </h4>

            {reportsData.monthlyWise.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No monthly transaction data.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reportsData.monthlyWise.map((m) => (
                  <div
                    key={m.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--border-light)',
                      fontSize: 13
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.monthLabel}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {m.count} {m.count === 1 ? 'transaction' : 'transactions'} • Given: {formatINR(m.given)}
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, color: 'var(--primary-accent)' }}>
                      {formatCost(m.cost)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BACKUP & RESTORE */}
      {subTab === 'backup' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Download size={18} style={{ color: 'var(--primary-accent)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>Export Complete Backup</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Download all your Armaan Accounts data (people, transactions, repayment sections, and edit history) into a secure JSON backup file. Keep this copy saved safely.
            </p>

            {lastBackupExportedAt ? (
              <div
                style={{
                  fontSize: 12,
                  color: '#047857',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#ecfdf5',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #a7f3d0'
                }}
              >
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                <span>
                  Last backup exported: <b>{new Date(lastBackupExportedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b>
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                Last backup exported: <b>Never on this device</b>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={exportBackup}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Download size={18} />
              <span>Download Backup File (.json)</span>
            </button>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Upload size={18} style={{ color: '#047857' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>Import Backup File</h3>
            </div>
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 12,
                color: '#92400e',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 12
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <b>Important Warning:</b> Importing a backup file will replace the current local data stored in this browser with the data from the imported file.
              </div>
            </div>

            {importStatus && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  background: importStatus.success ? '#ecfdf5' : '#fef2f2',
                  color: importStatus.success ? '#047857' : '#b91c1c',
                  border: `1px solid ${importStatus.success ? '#a7f3d0' : '#fecaca'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {importStatus.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{importStatus.message}</span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Upload size={18} />
              <span>Select Backup File to Restore</span>
            </button>
          </div>

          {/* Reset / Sample Data */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
              Sample Data & Reset Options
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Reset to sample demonstration data or start clean.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="btn-sm btn-secondary"
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Reset to Sample Data',
                    message: 'Reset all accounts and transactions to the sample demonstration data?',
                    warningNote: 'Any custom records created will be replaced with default sample demo data.',
                    confirmText: 'Reset to Sample',
                    danger: true,
                    onConfirm: () => {
                      resetToSampleData();
                    }
                  });
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <RefreshCw size={14} />
                <span>Load Sample Demonstration Data</span>
              </button>

              <button
                type="button"
                className="btn-sm btn-danger"
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Clear All Data',
                    message: 'Are you sure you want to permanently clear all data and start completely fresh?',
                    warningNote: 'All people, transactions, and settings will be permanently wiped out.',
                    confirmText: 'Clear All Data',
                    danger: true,
                    onConfirm: () => {
                      clearAllData();
                    }
                  });
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <span>Clear All Data & Start Fresh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {subTab === 'settings' && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <SettingsIcon size={18} style={{ color: 'var(--primary-accent)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>Application Settings</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Application Name</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>Armaan Accounts</div>
            </div>

            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Standard Annual Financing Rate</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-accent)' }}>
                    {settings.annualRate}% per year
                  </div>
                </div>
                <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                  Fixed Rate
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Used for exact elapsed time calculation: Amount × 17.5% × (elapsed time / 365 days).
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Currency</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>INR (₹) Indian Rupee</div>
            </div>

            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Timezone</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>India (IST, UTC+05:30)</div>
            </div>

            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Storage</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Browser LocalStorage (Offline capable)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Entries remain saved automatically when reopening on this device and browser.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
