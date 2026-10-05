import type { Transaction, TransactionCostBreakdown, CostSegment, TransactionStatus } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365 * MS_PER_DAY;

/**
 * Parses date string (YYYY-MM-DD) and time string (HH:mm) into a local Date object.
 */
export function parseDateTime(dateStr: string, timeStr: string = '00:00'): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
}

/**
 * Determines current status of a transaction
 */
export function getTransactionStatus(
  amountGiven: number,
  totalReturned: number,
  expectedReturnDateStr: string,
  now: Date = new Date()
): TransactionStatus {
  const outstanding = Math.max(0, amountGiven - totalReturned);

  if (outstanding <= 0.001) {
    return 'Closed';
  }

  // Check if overdue
  if (expectedReturnDateStr) {
    // Expected return date at end of that day (23:59:59.999)
    const [year, month, day] = expectedReturnDateStr.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    if (now > dueDate) {
      return 'Overdue';
    }
  }

  if (totalReturned > 0) {
    return 'Partially Repaid';
  }

  return 'Open';
}

/**
 * Calculates financing cost for a principal amount over exact elapsed milliseconds
 */
export function calculateSegmentCost(principal: number, elapsedMs: number, annualRatePercent: number): number {
  if (principal <= 0 || elapsedMs <= 0) return 0;
  const rateFraction = annualRatePercent / 100;
  const elapsedYears = elapsedMs / MS_PER_YEAR;
  return principal * rateFraction * elapsedYears;
}

/**
 * Calculates daily cost for a given outstanding principal
 * Formula: Current Outstanding multiplied by 17.5 percent divided by 365
 */
export function calculateDailyCost(outstanding: number, annualRatePercent: number): number {
  if (outstanding <= 0) return 0;
  return (outstanding * (annualRatePercent / 100)) / 365;
}

/**
 * Calculates complete financing cost and returns breakdown for a transaction
 */
export function calculateTransactionCost(
  transaction: Transaction,
  now: Date = new Date(),
  annualRatePercent: number = 17.5
): TransactionCostBreakdown {
  const startTime = parseDateTime(transaction.dateGiven, transaction.timeGiven);
  const initialPrincipal = transaction.amountGiven;

  // Sort returns chronologically
  const sortedReturns = [...(transaction.returns || [])].sort((a, b) => {
    const timeA = parseDateTime(a.returnDate, a.returnTime).getTime();
    const timeB = parseDateTime(b.returnDate, b.returnTime).getTime();
    return timeA - timeB;
  });

  const segments: CostSegment[] = [];
  let currentPrincipal = initialPrincipal;
  let segmentStartTime = startTime;
  let totalReturned = 0;

  for (let i = 0; i < sortedReturns.length; i++) {
    const ret = sortedReturns[i];
    const returnTime = parseDateTime(ret.returnDate, ret.returnTime);
    
    // Ensure return time is not before segment start
    const validReturnTime = returnTime.getTime() > segmentStartTime.getTime() ? returnTime : segmentStartTime;
    const elapsedMs = Math.max(0, validReturnTime.getTime() - segmentStartTime.getTime());
    const cost = calculateSegmentCost(currentPrincipal, elapsedMs, annualRatePercent);

    segments.push({
      startDate: segmentStartTime,
      endDate: validReturnTime,
      principal: currentPrincipal,
      elapsedHours: elapsedMs / (1000 * 60 * 60),
      cost,
      description: `₹${ret.returnedAmount.toLocaleString('en-IN')} returned on ${ret.returnDate} at ${ret.returnTime || '00:00'}`
    });

    totalReturned += ret.returnedAmount;
    currentPrincipal = Math.max(0, currentPrincipal - ret.returnedAmount);
    segmentStartTime = validReturnTime;

    if (currentPrincipal <= 0) {
      break;
    }
  }

  const outstanding = Math.max(0, initialPrincipal - totalReturned);
  const isClosed = outstanding <= 0.001;

  // If still outstanding and not closed, calculate cost up to 'now'
  if (!isClosed && currentPrincipal > 0) {
    const effectiveNow = now.getTime() > segmentStartTime.getTime() ? now : segmentStartTime;
    const elapsedMs = Math.max(0, effectiveNow.getTime() - segmentStartTime.getTime());
    const cost = calculateSegmentCost(currentPrincipal, elapsedMs, annualRatePercent);

    segments.push({
      startDate: segmentStartTime,
      endDate: effectiveNow,
      principal: currentPrincipal,
      elapsedHours: elapsedMs / (1000 * 60 * 60),
      cost,
      description: `Active on ₹${currentPrincipal.toLocaleString('en-IN')} outstanding`
    });
  }

  const totalCost = segments.reduce((sum, s) => sum + s.cost, 0);
  const dailyCost = calculateDailyCost(outstanding, annualRatePercent);
  const status = getTransactionStatus(initialPrincipal, totalReturned, transaction.expectedReturnDate, now);

  return {
    totalCost,
    dailyCost,
    outstanding,
    totalReturned,
    isClosed,
    status,
    segments
  };
}

/**
 * Calculates Today's accumulated financing cost across all active transactions
 * Calculates the exact portion of interest generated since the beginning of today (00:00:00)
 */
export function calculateTodayFinancingCost(
  transactions: Transaction[],
  now: Date = new Date(),
  annualRatePercent: number = 17.5
): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();
  const nowMs = now.getTime();

  if (nowMs <= startOfTodayMs) return 0;

  let todayCost = 0;

  for (const tx of transactions) {
    const breakdown = calculateTransactionCost(tx, now, annualRatePercent);
    for (const segment of breakdown.segments) {
      const segStartMs = segment.startDate.getTime();
      const segEndMs = segment.endDate.getTime();

      // Intersection of [segStartMs, segEndMs] with [startOfTodayMs, nowMs]
      const overlapStart = Math.max(segStartMs, startOfTodayMs);
      const overlapEnd = Math.min(segEndMs, nowMs);

      if (overlapEnd > overlapStart) {
        const elapsedMs = overlapEnd - overlapStart;
        todayCost += calculateSegmentCost(segment.principal, elapsedMs, annualRatePercent);
      }
    }
  }

  return todayCost;
}

/**
 * Calculates Days Overdue for an overdue transaction
 */
export function getDaysOverdue(expectedReturnDateStr: string, now: Date = new Date()): number {
  if (!expectedReturnDateStr) return 0;
  const [year, month, day] = expectedReturnDateStr.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (now <= dueDate) return 0;
  const diffMs = now.getTime() - dueDate.getTime();
  return Math.ceil(diffMs / MS_PER_DAY);
}
