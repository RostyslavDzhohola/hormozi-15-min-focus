import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { EntryData } from '@/types/entry';

// Storage keys
const ENTRIES_KEY = 'time_tracker_entries';
const SETTINGS_KEY = 'time_tracker_settings';
const SESSION_KEY = 'time_tracker_session';

// Helper: Get all entries
export async function getAllEntries(): Promise<EntryData[]> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(ENTRIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } else {
      const filePath = `${FileSystem.documentDirectory}${ENTRIES_KEY}.json`;
      const fileExists = await FileSystem.getInfoAsync(filePath);

      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
}

// Helper: Save all entries
async function saveAllEntries(entries: EntryData[]): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    } else {
      const filePath = `${FileSystem.documentDirectory}${ENTRIES_KEY}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(entries));
    }
  } catch (error) {
    console.error('Error saving entries:', error);
  }
}

// Save a new entry
export async function saveEntry(entry: EntryData): Promise<void> {
  const entries = await getAllEntries();
  entries.push(entry);
  await saveAllEntries(entries);

  // Dispatch storage event for cross-tab synchronization
  if (Platform.OS === 'web') {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: ENTRIES_KEY,
        newValue: JSON.stringify(entries),
      })
    );
  }
}

// Get entries for a specific date
export async function getEntriesForDate(date: Date): Promise<EntryData[]> {
  const entries = await getAllEntries();

  // Set time to beginning of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // Set time to end of day
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Filter entries for the selected date and sort by timestamp (newest first)
  return entries
    .filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startOfDay && entryDate <= endOfDay;
    })
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

// Delete an entry by ID
export async function deleteEntryById(id: string): Promise<void> {
  const entries = await getAllEntries();
  const updatedEntries = entries.filter((entry) => entry.id !== id);
  await saveAllEntries(updatedEntries);

  // Dispatch storage event for cross-tab synchronization
  if (Platform.OS === 'web') {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: ENTRIES_KEY,
        newValue: JSON.stringify(updatedEntries),
      })
    );
  }
}

// Update an entry's text by ID
export async function updateEntryTextInStorage(
  id: string,
  newText: string
): Promise<void> {
  const entries = await getAllEntries();
  const entryIndex = entries.findIndex((entry) => entry.id === id);

  if (entryIndex !== -1) {
    entries[entryIndex].text = newText;
    await saveAllEntries(entries);

    // Dispatch storage event for cross-tab synchronization
    if (Platform.OS === 'web') {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: ENTRIES_KEY, // Assuming ENTRIES_KEY is accessible here (it is defined at the top of the file)
          newValue: JSON.stringify(entries),
        })
      );
    }
  } else {
    console.warn(`Entry with id ${id} not found, cannot update.`);
  }
}

// Get settings
export async function getSettings(): Promise<any> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? JSON.parse(stored) : null;
    } else {
      const filePath = `${FileSystem.documentDirectory}${SETTINGS_KEY}.json`;
      const fileExists = await FileSystem.getInfoAsync(filePath);

      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}

// Save settings
export async function saveSettings(settings: any): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } else {
      const filePath = `${FileSystem.documentDirectory}${SETTINGS_KEY}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(settings));
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Clear all data
export async function clearAllData(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ENTRIES_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(SESSION_KEY);
    } else {
      const entriesPath = `${FileSystem.documentDirectory}${ENTRIES_KEY}.json`;
      const settingsPath = `${FileSystem.documentDirectory}${SETTINGS_KEY}.json`;
      const sessionPath = `${FileSystem.documentDirectory}${SESSION_KEY}.json`;

      const entriesExist = await FileSystem.getInfoAsync(entriesPath);
      const settingsExist = await FileSystem.getInfoAsync(settingsPath);
      const sessionExist = await FileSystem.getInfoAsync(sessionPath);

      if (entriesExist.exists) {
        await FileSystem.deleteAsync(entriesPath);
      }

      if (settingsExist.exists) {
        await FileSystem.deleteAsync(settingsPath);
      }

      if (sessionExist.exists) {
        await FileSystem.deleteAsync(sessionPath);
      }
    }
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// Get session state
export async function getSessionState(): Promise<SessionState | null> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } else {
      const filePath = `${FileSystem.documentDirectory}${SESSION_KEY}.json`;
      const fileExists = await FileSystem.getInfoAsync(filePath);

      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting session state:', error);
    return null;
  }
}

// Save session state
export async function saveSessionState(state: SessionState): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } else {
      const filePath = `${FileSystem.documentDirectory}${SESSION_KEY}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(state));
    }
  } catch (error) {
    console.error('Error saving session state:', error);
  }
}
