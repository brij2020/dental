/**
 * IST (Asia/Kolkata) Date Utilities
 * Provides consistent date handling across the application
 * IST is UTC+5:30
 */

/**
 * Get IST date strings for both display and API
 * @param date - Date to convert
 * @returns Object with display (formatted) and api (YYYY-MM-DD) strings
 */
export const getISTDate = (date: Date) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istOffset = 330; // minutes
  const istTime = new Date(utc + istOffset * 60000);
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  
  // For display: e.g. Mon, Jan 28, 2026
  const display = istTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  
  // For API: YYYY-MM-DD
  const api = `${year}-${month}-${day}`;
  
  return { display, api, istTime };
};

/**
 * Get today's date in IST as YYYY-MM-DD string
 * @returns Today's date in YYYY-MM-DD format (IST)
 */
export const getTodayISTString = (): string => {
  const { api } = getISTDate(new Date());
  return api;
};

/**
 * Get today's date in IST with display format
 * @returns Object with display and api date strings
 */
export const getTodayIST = () => {
  return getISTDate(new Date());
};

/**
 * Check if a date string (YYYY-MM-DD) is in the past
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const today = getTodayISTString();
  return dateString < today;
};

/**
 * Check if a date string (YYYY-MM-DD) is today
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if date is today
 */
export const isTodayDate = (dateString: string): boolean => {
  const today = getTodayISTString();
  return dateString === today;
};

/**
 * Check if a date string (YYYY-MM-DD) is in the future
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  const today = getTodayISTString();
  return dateString > today;
};
