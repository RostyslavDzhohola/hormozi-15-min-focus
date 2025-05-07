import { Platform, AppState } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { scheduleNotificationAsync } from '@/utils/notifications';
import { getSessionState, saveSessionState } from '@/utils/storage';
import { SessionState, TimerStatus } from '@/types/entry';
import { startTimer, stopTimer } from '@/utils/backgroundTimer';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[Timer]', new Date().toISOString(), ...args);
  }
}

const TEST_DURATION = Platform.OS === 'web' ? 5 : 3; // 5 seconds for web, 3 for mobile

export const useTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timeUntilNext15Min, setTimeUntilNext15Min] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [lastNotificationTime, setLastNotificationTime] = useState('');
  const [testMode, setTestMode] = useState(false);
  const shouldShowModalRef = useRef(true);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const sessionRef = useRef<SessionState>({
    isActive: false,
    startTime: null,
    currentEntry: null,
  });

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const now = Date.now();
      if (nextAppState === 'active' && isRunning) {
        // App came back to foreground, calculate elapsed time
        const elapsed = now - lastUpdateRef.current;
        if (testMode) {
          // For test mode, directly update remaining seconds
          setRemainingSeconds(prev => Math.max(0, prev - Math.floor(elapsed / 1000)));
        } else {
          // For normal mode, recalculate time until next 15-min interval
          calculateTimeUntilNext15Min();
        }
      }
      lastUpdateRef.current = now;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, testMode]);
  
  // Load session state on mount
  useEffect(() => {
    const loadSession = async () => {
      log('Loading session state');
      const savedSession = await getSessionState();
      log('Loaded session state:', savedSession);
      if (savedSession) {
        sessionRef.current = savedSession;
        if (savedSession.isActive) {
          log('Restoring active session');
          setIsRunning(true);
          calculateTimeUntilNext15Min();
        }
      }
    };
    
    loadSession();
  }, []);
  
  // Calculate time until next 15-minute interval (0, 15, 30, 45)
  const calculateTimeUntilNext15Min = useCallback(() => {
    const now = new Date();
    log('Calculating next interval at:', now);
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Calculate the next 15-minute mark
    const minutesUntilNext15 = 15 - (minutes % 15);
    const secondsTotal = minutesUntilNext15 * 60 - seconds;
    log('Time until next interval:', { minutesUntilNext15, secondsTotal });
    
    setTimeUntilNext15Min(secondsTotal);
    setRemainingSeconds(secondsTotal);
    
    // Format the current time
    const hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    setCurrentTime(`${hour12}:${formattedMinutes} ${ampm}`);
    
    return secondsTotal;
  }, []);
  
  // Check if it's time to trigger a notification
  const checkTimeAndTriggerNotification = useCallback(() => {
    if (!isRunning) return false;
    log('Checking notification trigger:', { testMode, remainingSeconds, timeUntilNext15Min });
    
    const isCompleted = testMode ? remainingSeconds <= 0 : timeUntilNext15Min === 0;
    
    if (isCompleted) {
      log('Timer completed, checking for notification');
      const now = new Date();
      const minutes = now.getMinutes();
      const timeKey = `${now.getHours()}:${minutes}`;
      
      if (timeKey !== lastNotificationTime) {
        log('Triggering notification and modal');
        setLastNotificationTime(timeKey);
        setTimerStatus('completed');
        shouldShowModalRef.current = true;
        
        if (!testMode) {
          log('Production mode: Continuing timer');
          calculateTimeUntilNext15Min();
          setIsRunning(true); // Keep timer running
        } else {
          log('Test mode: Stopping timer');
          setIsRunning(false); // Stop only in test mode
        }
        
        return true;
      }
    }
    
    return false;
  }, [isRunning, lastNotificationTime, timeUntilNext15Min, testMode, remainingSeconds, setTimerStatus]);
  
  // Start the timer
  const startSession = useCallback((isTest: boolean = false) => {
    setIsRunning(true);
    log('Starting session:', { isTest });
    shouldShowModalRef.current = false;
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();
    setTimerStatus('running');
    setTestMode(isTest);
    
    const newSession = {
      isActive: true,
      startTime: new Date().toISOString(),
      currentEntry: null,
    };
    sessionRef.current = newSession;
    saveSessionState(newSession);
    
    if (isTest) {
      // For test mode, start a 5-second countdown
      setRemainingSeconds(TEST_DURATION);
      setTimeUntilNext15Min(TEST_DURATION);
    } else {
      calculateTimeUntilNext15Min();
      if (Platform.OS !== 'web') {
        startTimer();
      }
    }
  }, [calculateTimeUntilNext15Min]);
  
  // Stop the timer
  const stopSession = useCallback(() => {
    try {
      log('Stopping session');
      setIsRunning(false);
      shouldShowModalRef.current = false;
      setTimerStatus('idle');
      setTestMode(false);
      
      if (testTimerRef.current) {
        clearInterval(testTimerRef.current);
        testTimerRef.current = null;
      }
      
      const newSession = {
        isActive: false,
        startTime: null,
        currentEntry: null,
      };
      sessionRef.current = newSession;
      
      // Save session state and stop timer in parallel
      return Promise.all([
        saveSessionState(newSession),
        Platform.OS !== 'web' ? stopTimer() : Promise.resolve()
      ]).catch(error => {
        console.warn('Error stopping session:', error);
      });
    } catch (error) {
      console.warn('Error in stopSession:', error);
    }
  }, []);
  
  // Update timer every second
  useEffect(() => {
    if (isRunning) {
      log('Setting up timer interval');
      const timer = setInterval(() => {
        if (testMode) {
          const now = Date.now();
          const elapsed = now - lastUpdateRef.current;
          lastUpdateRef.current = now;
          log('Test mode update:', { elapsed });
          
          setRemainingSeconds(prev => {
            const next = Math.max(0, prev - Math.floor(elapsed / 1000));
            log('Updated remaining seconds:', next);
            shouldShowModalRef.current = true;
            setTimerStatus('completed');
            return next;
          });
        } else {
          log('Production mode update');
          calculateTimeUntilNext15Min();
          if (timeUntilNext15Min === 0) {
            log('Interval complete, showing modal');
            shouldShowModalRef.current = true;
            setTimerStatus('completed');
            calculateTimeUntilNext15Min(); // Start next interval immediately
          }
        }
      }, 1000);
      
      testTimerRef.current = timer;
      return () => clearInterval(timer);
    }
  }, [isRunning, testMode, calculateTimeUntilNext15Min, timeUntilNext15Min]);
  
  return {
    isRunning,
    timeUntilNext15Min,
    currentTime,
    remainingSeconds,
    checkTimeAndTriggerNotification,
    startSession,
    stopSession,
    timerStatus,
    setTimerStatus,
    shouldShowModal: shouldShowModalRef.current,
    testMode,
  };
};