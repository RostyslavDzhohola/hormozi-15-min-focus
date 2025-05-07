import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { getEntriesForDate, deleteEntryById } from '@/utils/storage';
import { EntryData } from '@/types/entry';

export function useEntries(date: Date) {
  const [entries, setEntries] = useState<EntryData[]>([]);
  
  const loadEntries = useCallback(async () => {
    const entriesForDate = await getEntriesForDate(date);
    setEntries(entriesForDate); // Entries are already sorted in getEntriesForDate
  }, [date]);
  
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);
  
  // Listen for storage events to sync data across tabs/windows
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'time_tracker_entries') {
          loadEntries();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [loadEntries]);
  
  // Delete an entry
  const deleteEntry = async (id: string) => {
    await deleteEntryById(id);
    await loadEntries(); // Reload entries after deletion
  };
  
  return {
    entries,
    deleteEntry,
    refreshEntries: loadEntries,
  };
}