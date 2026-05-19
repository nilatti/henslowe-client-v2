import { parseISO, differenceInMinutes, format, startOfWeek, endOfWeek, isAfter } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { DATE_FORMAT_FOR_RAILS, DATE_TIME_FORMAT_FOR_RAILS, DEFAULT_TIMEZONE } from './constants';

function calculateDuration(endTime: string, startTime: string): number {
  return differenceInMinutes(parseISO(endTime), parseISO(startTime));
}

function formatDateForRails({ date }: { date: string }): string {
  return format(parseISO(date), DATE_FORMAT_FOR_RAILS);
}

function formatDateTimeForRails({ datetime }: { datetime: string }): string {
  console.log(datetime);
  return format(parseISO(datetime), DATE_TIME_FORMAT_FOR_RAILS);
}

function formatTimeForRails(time: string): string {
  return format(parseISO(time), DATE_TIME_FORMAT_FOR_RAILS);
}

function getStartOfWeek({ date, timezone }: { date: string; timezone?: string }): string {
  const tz = timezone || DEFAULT_TIMEZONE;
  const zonedDate = toZonedTime(parseISO(date), tz);
  const start = startOfWeek(zonedDate);
  return formatInTimeZone(start, tz, DATE_TIME_FORMAT_FOR_RAILS);
}

function getEndOfWeek({ date, timezone }: { date: string; timezone?: string }): string {
  const tz = timezone || DEFAULT_TIMEZONE;
  const zonedDate = toZonedTime(parseISO(date), tz);
  const end = endOfWeek(zonedDate);
  return formatInTimeZone(end, tz, DATE_TIME_FORMAT_FOR_RAILS);
}

export function isAfterDate(startDate: Date, current: Date): boolean {
  return isAfter(current, startDate);
}

export function isAfterTime(startTime: Date, endTime: Date): boolean {
  return isAfter(endTime, startTime);
}

export {
  calculateDuration,
  formatDateForRails,
  formatDateTimeForRails,
  formatTimeForRails,
  getEndOfWeek,
  getStartOfWeek,
};
