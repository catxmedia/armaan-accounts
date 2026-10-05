import React, { useState } from 'react';
import { useAccounts } from '../../context/AccountsContext';
import { X, Edit3, ArrowDownLeft, AlertCircle, History, Info, Trash2, Edit2 } from 'lucide-react';
import { formatINR, formatCost, formatDate, formatTime, formatDuration } from '../../utils/formatters';
import { calculateTransactionCost, parseDateTime, getDaysOverdue } from '../../utils/calculator';
import { EditTransactionModal } from './EditTransactionModal';

export const TransactionDetailModal: React.FC = () => {
  const {
    selectedTransactionId,
    setSelectedTransactionId,
    transactions,
    people,
    settings,
    now,
    openRecordReturn,
    deleteTransaction,
    deleteReturn,
    setEditingReturnData,
    setConfirmDialog
  } = useAccounts();

  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!selectedTransactionId) return null;

  const transaction = transactions.find((t) => t.id === selectedTransactionId);
  if (!transaction) return null;

  const person = people.find((p) => p.id === transaction.personId);
  const costBreakdown = calculateTransactionCost(transaction, now, settings.annualRate);

  const startTime = parseDateTime(transaction.dateGiven, transaction.timeGiven);
  const endTime = costBreakdown.isClosed && transaction.closedAt
    ? new Date(transaction.closedAt)
    : now;

  const durationStr = formatDuration(startTime, endTime);
  const daysOverdue = costBreakdown.status === 'Overdue'
    ? getDaysOverdue(transaction.expectedReturnDate, now)
    : 0;

  const statusClass = costBreakdown.status.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <div className="modal-backdrop" onClick={() => setSelectedTransactionId(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status-badge ${statusClass}`}>
                {costBreakdown.status}
              </span>
              <h2 className="modal-title">{transaction.transactionNumber}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn-sm btn-secondary"
                onClick={() => setEditModalOpen(true)}
                style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const hasReturns = transaction.returns.length > 0;
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Delete Transaction',
                    message: `Are you sure you want to delete transaction ${transaction.transactionNumber}?`,
                    warningNote: hasReturns
                      ? `This transaction has ${transaction.returns.length} recorded repayment(s). Deleting will permanently remove this transaction and all associated repayments, and recalculate all person and dashboard totals.`
                      : 'This will remove the transaction and immediately recalculate all person and dashboard totals.',
                    confirmText: 'Delete Transaction',
                    danger: true,
                    onConfirm: () => {
                      deleteTransaction(transaction.id);
                    }
                  });
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedTransactionId(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="modal-body">
            {/* Person Banner */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Person Account
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
                  {person?.name || 'Unknown'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {person?.mobileNumber || '-'}
                </div>
              </div>

              {!costBreakdown.isClosed && (
                <button
                  type="button"
                  className="btn-sm btn-return"
                  onClick={() => {
                    openRecordReturn(transaction.id, transaction.personId);
                  }}
                  style={{ gap: 4 }}
                >
                  <ArrowDownLeft size={14} />
                  <span>Record Return</span>
                </button>
              )}
            </div>

            {/* Financial Highlights Grid */}
            <div className="stats-grid-2x2">
              <div className="compact-stat-card">
                <div className="stat-label">Original Amount</div>
                <div className="stat-value">{formatINR(transaction.amountGiven)}</div>
                <div className="stat-subtext">Given to {person?.name?.split(' ')[0]}</div>
              </div>

              <div className={`compact-stat-card ${costBreakdown.outstanding > 0 ? 'alert' : ''}`}>
                <div className="stat-label">Current Outstanding</div>
                <div className={`stat-value ${costBreakdown.outstanding > 0 ? 'red' : ''}`}>
                  {formatINR(costBreakdown.outstanding)}
                </div>
                <div className="stat-subtext">
                  {costBreakdown.isClosed ? 'Fully settled' : `${formatINR(costBreakdown.totalReturned)} returned`}
                </div>
              </div>

              <div className="compact-stat-card" style={{ gridColumn: 'span 2', background: '#0f172a', color: '#fff', borderColor: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    {costBreakdown.isClosed ? 'Final Financing Cost' : 'Current Financing Cost (Live)'}
                  </div>
                  <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                    {settings.annualRate}% p.a.
                  </span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, margin: '6px 0', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {costBreakdown.isClosed && transaction.finalFinancingCost !== undefined
                    ? formatCost(transaction.finalFinancingCost)
                    : formatCost(costBreakdown.totalCost)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6 }}>
                  <span>Daily Cost: {formatCost(costBreakdown.dailyCost)}/day</span>
                  <span>Duration: {durationStr}</span>
                </div>
              </div>
            </div>

            {/* Overdue Alert Banner if Overdue */}
            {costBreakdown.status === 'Overdue' && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#991b1b',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                <div>
                  Overdue by <b>{daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}</b>. Expected return was {formatDate(transaction.expectedReturnDate)}.
                </div>
              </div>
            )}

            {/* Basic Details List */}
            <div className="card" style={{ padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Transaction Info
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date & Time Given:</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(transaction.dateGiven)} at {formatTime(transaction.timeGiven)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Return Date:</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(transaction.expectedReturnDate)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Remark:</span>
                  <span style={{ fontWeight: 600 }}>{transaction.remark || '-'}</span>
                </div>

                {costBreakdown.isClosed && transaction.closedAt && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Closed Date:</span>
                      <span style={{ fontWeight: 700, color: '#047857' }}>{formatDate(transaction.closedAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Closed Time:</span>
                      <span style={{ fontWeight: 700, color: '#047857' }}>
                        {formatTime(transaction.closedAt.split('T')[1]?.substring(0, 5))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Repayment History Timeline */}
            <div className="card" style={{ padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Repayment History ({transaction.returns.length})
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>
                  Total Returned: {formatINR(costBreakdown.totalReturned)}
                </span>
              </div>

              {transaction.returns.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                  No repayment recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {transaction.returns.map((ret, idx) => (
                    <div
                      key={ret.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#047857' }}>
                            +{formatINR(ret.returnedAmount)}
                          </span>
                          <span style={{ fontSize: 10, background: '#ecfdf5', color: '#047857', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                            #{idx + 1}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatDate(ret.returnDate)} at {formatTime(ret.returnTime)}
                          {ret.remark && ` • ${ret.remark}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setEditingReturnData({ transaction, returnRecord: ret })}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            color: '#334155'
                          }}
                          title="Edit Repayment"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Delete Repayment',
                              message: `Delete repayment of ${formatINR(ret.returnedAmount)} on ${formatDate(ret.returnDate)}?`,
                              warningNote: costBreakdown.isClosed
                                ? 'Deleting this repayment will cause the transaction to have an outstanding balance again. The transaction will automatically reopen and resume financing cost from the correct historical timeline.'
                                : 'Outstanding balance, financing costs, person totals, and dashboard totals will recalculate automatically.',
                              confirmText: 'Delete Repayment',
                              danger: true,
                              onConfirm: () => {
                                deleteReturn(transaction.id, ret.id);
                              }
                            });
                          }}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            color: '#dc2626'
                          }}
                          title="Delete Repayment"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step-by-Step Financing Cost Breakdown */}
            <div className="card" style={{ padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Info size={15} style={{ color: 'var(--primary-accent)' }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Financing Cost Calculation Sections
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Financing cost is calculated in exact sections at {settings.annualRate}% p.a. based on actual elapsed time.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {costBreakdown.segments.map((seg, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderLeft: '3px solid var(--primary-accent)',
                      background: '#f8fafc',
                      padding: '6px 10px',
                      borderRadius: '0 6px 6px 0',
                      fontSize: 12
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Section {idx + 1}: On {formatINR(seg.principal)}</span>
                      <span style={{ color: '#0f172a' }}>{formatCost(seg.cost)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatDate(seg.startDate)} {formatTime(`${seg.startDate.getHours()}:${seg.startDate.getMinutes()}`)} →{' '}
                      {formatDate(seg.endDate)} {formatTime(`${seg.endDate.getHours()}:${seg.endDate.getMinutes()}`)} ({formatDuration(seg.startDate, seg.endDate)})
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  marginTop: 8,
                  borderTop: '1px solid var(--border-light)',
                  fontWeight: 800,
                  fontSize: 13
                }}
              >
                <span>Total Accumulated Cost:</span>
                <span style={{ color: 'var(--primary-accent)' }}>
                  {costBreakdown.isClosed && transaction.finalFinancingCost !== undefined
                    ? formatCost(transaction.finalFinancingCost)
                    : formatCost(costBreakdown.totalCost)}
                </span>
              </div>
            </div>

            {/* Edit Audit Trail / History */}
            {transaction.editHistory && transaction.editHistory.length > 0 && (
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <History size={15} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Edit Audit History ({transaction.editHistory.length})
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {transaction.editHistory.map((ed) => (
                    <div
                      key={ed.id}
                      style={{
                        fontSize: 11,
                        background: '#f8fafc',
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        Changed {ed.field}: <span style={{ textDecoration: 'line-through', color: '#b91c1c' }}>{ed.oldValue}</span> → <span style={{ color: '#047857' }}>{ed.newValue}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(ed.date)} at {formatTime(ed.date.split('T')[1]?.substring(0, 5))}
                        {ed.reason && ` • Reason: ${ed.reason}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditTransactionModal
        transaction={transaction}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </>
  );
};
