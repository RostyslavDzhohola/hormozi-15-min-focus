export interface EntryData {
  id: string;
  text: string;
  timestamp: string;
  timeLabel: string;
}

export interface TimeSlot {
  value: string;
  label: string;
  timestamp: number;
}

export interface SettingsData {
  darkModeEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface SessionState {
  isActive: boolean;
  startTime: string | null;
  currentEntry: string | null;
}

export type TimerStatus = 'idle' | 'running' | 'completed';

export interface SessionData {
  activeTab?: string;
  timerState: SessionState;
}
