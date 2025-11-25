import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  subDays,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isToday,
  parseISO,
  eachDayOfInterval,
  getDay,
  startOfDay,
} from 'date-fns';

export const dateHelpers = {
  // Formatting
  formatDate: (date: Date, formatStr: string = 'yyyy-MM-dd'): string => {
    return format(date, formatStr);
  },

  formatDateDisplay: (date: Date): string => {
    return format(date, 'MMM d');
  },

  formatDayName: (date: Date): string => {
    return format(date, 'EEE');
  },

  formatMonthYear: (date: Date): string => {
    return format(date, 'MMMM yyyy');
  },

  // Week operations
  getWeekStart: (date: Date, weekStartsOn: 0 | 1 = 1): Date => {
    return startOfWeek(date, { weekStartsOn });
  },

  getWeekEnd: (date: Date, weekStartsOn: 0 | 1 = 1): Date => {
    return endOfWeek(date, { weekStartsOn });
  },

  getWeekDays: (date: Date, weekStartsOn: 0 | 1 = 1): Date[] => {
    const start = startOfWeek(date, { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  },

  // Month operations
  getMonthStart: (date: Date): Date => {
    return startOfMonth(date);
  },

  getMonthEnd: (date: Date): Date => {
    return endOfMonth(date);
  },

  getMonthDays: (date: Date): Date[] => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  },

  getCalendarDays: (date: Date, weekStartsOn: 0 | 1 = 1): Date[] => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  },

  // Navigation
  goToNextWeek: (date: Date): Date => {
    return addWeeks(date, 1);
  },

  goToPreviousWeek: (date: Date): Date => {
    return subWeeks(date, 1);
  },

  goToNextMonth: (date: Date): Date => {
    return addMonths(date, 1);
  },

  goToPreviousMonth: (date: Date): Date => {
    return subMonths(date, 1);
  },

  goToNextDay: (date: Date): Date => {
    return addDays(date, 1);
  },

  goToPreviousDay: (date: Date): Date => {
    return subDays(date, 1);
  },

  // Comparisons
  isSameDay: (date1: Date, date2: Date): boolean => {
    return isSameDay(date1, date2);
  },

  isSameWeek: (date1: Date, date2: Date, weekStartsOn: 0 | 1 = 1): boolean => {
    return isSameWeek(date1, date2, { weekStartsOn });
  },

  isSameMonth: (date1: Date, date2: Date): boolean => {
    return isSameMonth(date1, date2);
  },

  isToday: (date: Date): boolean => {
    return isToday(date);
  },

  // Parsing
  parseDate: (dateString: string): Date => {
    return parseISO(dateString);
  },

  toISOString: (date: Date): string => {
    return format(startOfDay(date), 'yyyy-MM-dd');
  },

  // Day info
  getDayOfWeek: (date: Date): number => {
    return getDay(date);
  },

  isWeekend: (date: Date): boolean => {
    const day = getDay(date);
    return day === 0 || day === 6;
  },

  // Relative date checks
  isPast: (date: Date): boolean => {
    return startOfDay(date) < startOfDay(new Date());
  },

  isFuture: (date: Date): boolean => {
    return startOfDay(date) > startOfDay(new Date());
  },
};

