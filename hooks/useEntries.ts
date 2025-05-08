import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  getEntriesForDate,
  deleteEntryById,
  updateEntryTextInStorage,
} from '@/utils/storage';
import { EntryData } from '@/types/entry';

const ENTRIES_KEY = 'time_tracker_entries';

export function useEntries(date: Date) {
  const [entries, setEntries] = useState<EntryData[]>([]);

  const loadEntries = useCallback(async () => {
    const entriesForDate = await getEntriesForDate(date);
    setEntries([...entriesForDate]);
  }, [date]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Listen for storage events to sync data across tabs/windows
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === ENTRIES_KEY) {
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

  // Function to update an entry's text
  const updateEntryText = async (id: string, newText: string) => {
    await updateEntryTextInStorage(id, newText);
    await loadEntries(); // Reload entries for the current date view
  };

  return {
    entries,
    deleteEntry,
    refreshEntries: loadEntries,
    updateEntryText,
  };
}
