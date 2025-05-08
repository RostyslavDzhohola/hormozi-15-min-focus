import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { EntryData } from '@/types/entry';
import { getEntriesForDate } from './storage';

// Helper function to get the ISO 8601 week number
function getWeekOfYear(date: Date): number {
  const target = new Date(date.valueOf());
  // ISO week day (0 = Monday, 6 = Sunday)
  const dayNr = (date.getDay() + 6) % 7;
  // Set to current Thursday in week
  target.setDate(target.getDate() - dayNr + 3);
  // Full year of current Thursday
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  // Week number is number of weeks between Thursday of current week and first Thursday of the year
  return (
    1 + Math.ceil((target.getTime() - firstThursday.getTime()) / 604800000)
  ); // 604800000 = 7 * 24 * 60 * 60 * 1000
}

// Helper to get the start of the week (Monday), ensuring time is 00:00:00
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Normalize time first
  const day = d.getDay(); // Sunday - Saturday : 0 - 6
  // Adjust to Monday: if Sunday (0), go back 6 days. Otherwise, go back (day - 1) days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

// Helper to format time as HH:MM (24-hour) from a Date object
function formatTimeHHMMFromDate(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

const DAY_NAMES_EXPORT = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Export entries to CSV format for the entire week
export async function exportEntries(selectedDate: Date): Promise<void> {
  try {
    const weekOfYear = getWeekOfYear(selectedDate);
    const startOfWeek = getStartOfWeek(selectedDate); // Monday, 00:00:00

    const weeklyData: Map<string, Map<string, string>> = new Map();
    DAY_NAMES_EXPORT.forEach((dayName) => weeklyData.set(dayName, new Map()));

    for (let i = 0; i < 7; i++) {
      const currentDateForLoop = new Date(startOfWeek);
      currentDateForLoop.setDate(startOfWeek.getDate() + i);

      const dayName = DAY_NAMES_EXPORT[i];
      const entriesForDay: EntryData[] = await getEntriesForDate(
        currentDateForLoop
      );

      const dayMap = weeklyData.get(dayName)!;
      entriesForDay.forEach((entry) => {
        const entryDate = new Date(entry.timestamp); // Corrected: use entry.timestamp
        const timeKey = formatTimeHHMMFromDate(entryDate); // Format as HH:MM
        dayMap.set(timeKey, entry.text);
      });
    }

    const timeSlots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        timeSlots.push(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        );
      }
    }

    const bom = '\uFEFF'; // UTF-8 Byte Order Mark
    const headerRow = `Time,${DAY_NAMES_EXPORT.join(',')}\n`;
    let csvRowsString = '';

    timeSlots.forEach((slot) => {
      const rowArray: string[] = [slot];
      DAY_NAMES_EXPORT.forEach((dayName) => {
        const description = weeklyData.get(dayName)?.get(slot) || '';
        rowArray.push(`"${description.replace(/"/g, '""')}"`);
      });
      csvRowsString += rowArray.join(',') + '\n';
    });

    const csvContent = bom + headerRow + csvRowsString;
    const filename = `hormozi-time-tracker-week-${weekOfYear}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); // Required for Firefox
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const filePath = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: `Export Week ${weekOfYear} Data`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        console.log('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Error exporting weekly entries to CSV:', error);
  }
}
