import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique billing number with format: SEW-YYYYMM-XXX
 * Sequence resets monthly and persists in localStorage
 * Falls back to timestamp-based generation if storage is unavailable
 * 
 * @returns A unique billing number (e.g., "SEW-202601-001")
 */
export function generateBillingNumber(): string {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Storage key for current month's sequence
    const storageKey = `billing_sequence_${yearMonth}`;
    const lastMonthKey = 'billing_last_month';
    
    // Get stored values
    const storedSequence = localStorage.getItem(storageKey);
    const storedLastMonth = localStorage.getItem(lastMonthKey);
    
    let sequence: number;
    
    // Check if we're in a new month - reset sequence if so
    if (storedLastMonth !== yearMonth) {
      sequence = 1;
      localStorage.setItem(lastMonthKey, yearMonth);
    } else {
      // Continue with existing sequence
      sequence = storedSequence ? parseInt(storedSequence, 10) + 1 : 1;
    }
    
    // Save new sequence
    localStorage.setItem(storageKey, String(sequence));
    
    // Format sequence as 3-digit number
    const sequenceStr = String(sequence).padStart(3, '0');
    
    return `SEW-${yearMonth}-${sequenceStr}`;
    
  } catch (error) {
    // Fallback to timestamp-based generation if localStorage fails
    console.warn('Failed to generate sequential billing number, using timestamp fallback:', error);
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime();
    const randomPart = String(timestamp).slice(-3);
    
    return `SEW-${year}${month}-${randomPart}`;
  }
}

/**
 * Formats a number as currency (PHP)
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₱1,234.56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}