/**
 * Formats a number to Indian Rupee currency format (e.g., ₹1,25,000 or ₹143.84)
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const rounded = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = rounded.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering system formatting
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  if (showDecimals && decimalPart !== undefined) {
    return `₹${formattedInt}.${decimalPart}`;
  }
  return `₹${formattedInt}`;
}

/**
 * Formats cost specifically with 2 decimals
 */
export function formatCost(amount: number): string {
  return formatINR(amount, true);
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats date into standard "01 Oct 2026" format
 */
export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return '-';
  let d: Date;
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      d = new Date(dateInput);
    } else {
      const [year, month, day] = dateInput.split('-').map(Number);
      d = new Date(year, month - 1, day);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats 24h time "16:00" to "04:00 PM"
 */
export function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [hoursStr, minsStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const mins = minsStr || '00';
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${mins} ${ampm}`;
}

/**
 * Formats relative activity date (Today, Yesterday, or 02 Oct 2026) with time
 */
export function formatRelativeActivity(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  const formattedTime = timeStr ? formatTime(timeStr) : '';

  if (eventDate.getTime() === startOfToday.getTime()) {
    return formattedTime ? `Today, ${formattedTime}` : 'Today';
  } else if (eventDate.getTime() === startOfYesterday.getTime()) {
    return formattedTime ? `Yesterday, ${formattedTime}` : 'Yesterday';
  } else {
    const formattedD = formatDate(dateStr);
    return formattedTime ? `${formattedD}, ${formattedTime}` : formattedD;
  }
}

/**
 * Format total duration between two dates
 */
export function formatDuration(startDate: Date, endDate: Date = new Date()): string {
  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (days === 0 && totalHours === 0) {
    return `${Math.max(1, totalMinutes)} min`;
  }
  if (days === 0) {
    return `${totalHours} hr ${totalMinutes % 60} min`;
  }
  if (remainingHours === 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  return `${days}d ${remainingHours}h`;
}

/**
 * Helper to get current Indian date in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get current Indian time in HH:mm
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}
