import { useState, useEffect } from 'react';

/**
 * All school operations at Melstar Children Training Centre (New Gbawe, Accra, Ghana)
 * operate strictly on Greenwich Mean Time (GMT / UTC+0).
 * This module guarantees 100% accurate time and date calculations in GMT regardless
 * of the user's browser, computer, or device local timezone.
 */

/**
 * Returns today's ISO date string (YYYY-MM-DD) in GMT.
 */
export function getTodayGmtIso(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns current timestamp in ISO format (GMT/UTC).
 */
export function getNowGmtIso(): string {
  return new Date().toISOString();
}

/**
 * Format a date string or Date object strictly in GMT (UTC+0).
 */
export function formatGmtDate(
  dateInput?: string | Date | null,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  if (!dateInput) return '—';
  
  // If it's a date-only string like "2026-10-23", ensure it is parsed as UTC midnight
  let dateObj: Date;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    dateObj = new Date(`${dateInput}T00:00:00Z`);
  } else {
    dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  }

  if (isNaN(dateObj.getTime())) return String(dateInput);

  if (style === 'short') {
    return dateObj.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (style === 'long' || style === 'full') {
    return dateObj.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Medium (default): e.g. "23 Oct 2026"
  return dateObj.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time strictly in GMT (UTC+0), e.g. "20:34 GMT".
 */
export function formatGmtTime(
  dateInput?: string | Date | null,
  includeSeconds = false
): string {
  if (!dateInput) return '—';
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return '—';

  const timeStr = dateObj.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  });

  return `${timeStr} GMT`;
}

/**
 * Format date and time strictly in GMT, e.g. "23 Oct 2026, 20:34 GMT".
 */
export function formatGmtDateTime(
  dateInput?: string | Date | null,
  includeSeconds = false
): string {
  if (!dateInput) return '—';
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return '—';

  const datePart = dateObj.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timePart = dateObj.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  });

  return `${datePart}, ${timePart} GMT`;
}

/**
 * Custom React hook that supplies a real-time GMT clock updated every second.
 */
export function useGmtClock() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dateFormatted = now.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const dateFull = now.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeFormatted = now.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const timeShort = now.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isoDate = now.toISOString().split('T')[0];

  return {
    now,
    isoDate,
    dateFormatted,
    dateFull,
    timeFormatted,
    timeShort,
    termName: 'Term 1',
    academicYear: '2026/2027',
  };
}
