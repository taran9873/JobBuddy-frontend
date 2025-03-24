import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely format a date string to a distance string
 * @param dateString - The date string to format
 * @returns A formatted string or empty string if invalid
 */
export function safeFormatDistanceToNow(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    // Check if dateString is MongoDB date format with $date field
    if (typeof dateString === 'object' && dateString !== null) {
      const mongoDate = (dateString as any).$date;
      if (mongoDate) {
        dateString = mongoDate;
      }
    }
    
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error, 'Date string was:', dateString);
    return '';
  }
}

/**
 * Safely format a date string to a locale date string
 * @param dateString - The date string to format
 * @param fallback - Fallback string if date is invalid
 * @returns A formatted string or fallback if invalid
 */
export function safeFormatDate(dateString: string | null | undefined, fallback: string = ''): string {
  if (!dateString) return fallback;
  
  try {
    // Check if dateString is MongoDB date format with $date field
    if (typeof dateString === 'object' && dateString !== null) {
      const mongoDate = (dateString as any).$date;
      if (mongoDate) {
        dateString = mongoDate;
      }
    }
    
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return fallback;
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error, 'Date string was:', dateString);
    return fallback;
  }
}
