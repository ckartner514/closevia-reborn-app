
import { differenceInDays, parseISO, isAfter, isBefore, addDays, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Check if a date is within the past week
 */
export const isWithinWeek = (dateString: string | null): boolean => {
  if (!dateString) return false;
  
  const date = parseISO(dateString);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  return !isBefore(date, weekStart) && !isAfter(date, weekEnd);
};

/**
 * Check if a date is within the past X days
 */
export const isWithinPast = (dateString: string | null, days: number): boolean => {
  if (!dateString) return false;
  
  const date = parseISO(dateString);
  const now = new Date();
  const pastDate = addDays(now, -days);
  
  return !isBefore(date, pastDate) && !isAfter(date, now);
};

/**
 * Check if a date is within the next X days
 */
export const isWithinNext = (dateString: string | null, days: number): boolean => {
  if (!dateString) return false;
  
  const date = parseISO(dateString);
  const now = new Date();
  const futureDate = addDays(now, days);
  
  return !isBefore(date, now) && !isAfter(date, futureDate);
};

/**
 * Check if a date is overdue (before today)
 */
export const isOverdue = (dateString: string | null): boolean => {
  if (!dateString) return false;
  
  const date = parseISO(dateString);
  const now = new Date();
  // Set now to the beginning of the day for fair comparison
  now.setHours(0, 0, 0, 0);
  
  return isBefore(date, now);
};

/**
 * Filter invoices/proposals by amount range
 */
export const filterByAmountRange = (amount: number, range: string): boolean => {
  switch (range) {
    case 'lt500':
      return amount < 500;
    case '500-1000':
      return amount >= 500 && amount <= 1000;
    case '1000-5000':
      return amount > 1000 && amount <= 5000;
    case 'gt5000':
      return amount > 5000;
    case 'all':
    default:
      return true;
  }
};
