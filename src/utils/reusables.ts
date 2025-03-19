import type { User } from './types';

export const getUserFromStorage = (): User | null => {
  const userString = localStorage.getItem('user');
  if (!userString) {
    console.error('User not found');
    return null;
  }
  return JSON.parse(userString) as User;
};

type DateFormat =
  | 'YYYY DD MM HH:mm' // 2025 18 03 14:30
  | 'YYYY-DD-MM HH:mm' // 2025-18-03 14:30
  | 'YYYY/DD/MM HH:mm' // 2025/18/03 14:30
  | 'YYYY.DD.MM HH:mm' // 2025.18.03 14:30
  | 'YYYY DD MM | HH:mm' // 2025 18 03 | 14:30
  | 'YYYY_DD_MM_HHmm' // 2025_18_03_14_30
  | 'YYYYDDMM HHmm' // 20251803 1430
  | 'YYYY DD MMM HH:mm' // 2025 18 Mar 14:30
  | 'YYYY-MMMM-DD HH:mm' // 2025-March-18 14:30
  | 'DD-MM-YYYY HH:mm' // 18-03-2025 14:30
  | 'DD MMM YYYY HH:mm' // 18 Mar 2025 13:28
  | 'DD MMM HH:mm'; // 18 Mar 14:30

export const formatDate = (
  date: string | Date,
  format: DateFormat = 'YYYY DD MM HH:mm'
): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const fullMonthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const replacements: Record<string, string> = {
    YYYY: year.toString(),
    DD: day,
    MM: month,
    MMM: monthNames[d.getMonth()],
    MMMM: fullMonthNames[d.getMonth()],
    HH: hours,
    mm: minutes,
  };

  return format.replace(/YYYY|DD|MMM|MM|MMMM|HH|mm/g, (match) => replacements[match] || match);
};

export const formatChatDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time part for date comparison
  const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const formattedHours = hours % 12 || 12;

  // If it's today, just show time with am/pm
  if (messageDate.getTime() === todayDate.getTime()) {
    return `${formattedHours}:${minutes} ${ampm}`;
  }

  // If it's yesterday, show "Yesterday" with time
  if (messageDate.getTime() === yesterdayDate.getTime()) {
    return `Yesterday ${formattedHours}:${minutes} ${ampm}`;
  }

  // For other days, show short date with time
  return formatDate(d, 'DD MMM HH:mm');
};
