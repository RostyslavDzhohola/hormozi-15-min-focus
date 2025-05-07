import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { EntryData } from '@/types/entry';
import { getEntriesForDate } from './storage';

// Export entries to CSV format
export async function exportEntries(date: Date): Promise<void> {
  try {
    const entries = await getEntriesForDate(date);
    
    if (entries.length === 0) {
      console.log('No entries to export');
      return;
    }
    
    // Create CSV content
    const headers = 'Time,Activity\n';
    const rows = entries.map(entry => `"${entry.timeLabel}","${entry.text.replace(/"/g, '""')}"`).join('\n');
    const csvContent = headers + rows;
    
    // Format date for filename
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `time-tracker-${formattedDate}.csv`;
    
    if (Platform.OS === 'web') {
      // For web, trigger a download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For mobile, save to file and share
      const filePath = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Time Tracker Data',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        console.log('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Error exporting entries:', error);
  }
}