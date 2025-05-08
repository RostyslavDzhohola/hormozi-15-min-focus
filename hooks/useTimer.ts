import { Platform, AppState } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSessionState, saveSessionState } from '@/utils/storage';
import { SessionState, TimerStatus } from '@/types/entry';
// import * as Notifications from 'expo-notifications'; // Removed as unused in this file

const TEST_DURATION = 5; // 5 seconds

export const useTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [testMode, setTestMode] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const sessionRef = useRef<SessionState>({
    isActive: false,
    startTime: null,
    currentEntry: null,
  });

  const updateCurrentTimeDisplay = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    setCurrentTime(`${hour12}:${formattedMinutes} ${ampm}`);
  }, []);

  const resetTimerToNextInterval = useCallback(() => {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();

    const minutesPastLastQuarter = currentMinutes % 15;
    const secondsElapsedInCurrentBlock =
      minutesPastLastQuarter * 60 + currentSeconds;
    let secondsLeft = 15 * 60 - secondsElapsedInCurrentBlock;

    if (secondsLeft === 0 && secondsElapsedInCurrentBlock !== 0) {
    } else if (
      secondsLeft === 15 * 60 ||
      (secondsLeft === 0 && secondsElapsedInCurrentBlock === 0)
    ) {
      secondsLeft = 15 * 60;
    }

    setRemainingSeconds(secondsLeft);
    updateCurrentTimeDisplay();
    return secondsLeft;
  }, [updateCurrentTimeDisplay]);

  useEffect(() => {
    const loadSession = async () => {
      const savedSession = await getSessionState();
      if (savedSession) {
        sessionRef.current = savedSession;
        if (savedSession.isActive && savedSession.startTime) {
          setIsRunning(true);
          lastUpdateRef.current = new Date(savedSession.startTime).getTime();
          setTestMode(false);
          resetTimerToNextInterval();
        }
      }
    };
    loadSession();
  }, [resetTimerToNextInterval]);

  useEffect(() => {
    if (isRunning) {
      lastUpdateRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prevSeconds) => {
          const newRemaining = Math.max(0, prevSeconds - 1);
          return newRemaining;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const now = Date.now();

      if (sessionRef.current.isActive) {
        if (nextAppState === 'active') {
          console.log('[useTimer] App became active. Session is active.');
          const elapsedMs = now - lastUpdateRef.current;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);

          if (testMode) {
            setRemainingSeconds((prev) => Math.max(0, prev - elapsedSeconds));
          } else {
            resetTimerToNextInterval();
          }
          lastUpdateRef.current = now;
        } else if (nextAppState.match(/inactive|background/)) {
          console.log('[useTimer] App going to background. Session is active.');
          lastUpdateRef.current = now;
        }
      } else {
        if (nextAppState === 'active') {
          console.log('[useTimer] App became active. Session NOT active.');
          lastUpdateRef.current = now;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [testMode, resetTimerToNextInterval]);

  const checkTimeAndTriggerCompletion = useCallback(() => {
    if (remainingSeconds > 0) return false;

    setTimerStatus('completed');

    if (testMode) {
      setIsRunning(false);
    } else {
      resetTimerToNextInterval();
    }
    return true;
  }, [remainingSeconds, timerStatus, testMode, resetTimerToNextInterval]);

  const startSession = useCallback(
    (isTest: boolean = false) => {
      setIsRunning(true);
      startTimeRef.current = Date.now();
      lastUpdateRef.current = Date.now();
      setTimerStatus('running');
      setTestMode(isTest);
      updateCurrentTimeDisplay();

      const sessionStartTime = new Date().toISOString();
      sessionRef.current = {
        isActive: true,
        startTime: sessionStartTime,
        currentEntry: null,
      };
      saveSessionState(sessionRef.current);

      if (isTest) {
        setRemainingSeconds(TEST_DURATION);
        return TEST_DURATION;
      } else {
        const initialSeconds = resetTimerToNextInterval();
        return initialSeconds;
      }
    },
    [resetTimerToNextInterval, updateCurrentTimeDisplay]
  );

  const stopSession = useCallback(async () => {
    setIsRunning(false);
    setTimerStatus('idle');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    sessionRef.current = {
      isActive: false,
      startTime: null,
      currentEntry: null,
    };

    try {
      await saveSessionState(sessionRef.current);
    } catch (error) {
      console.warn('Error stopping session:', error);
    }
  }, []);

  return {
    isRunning,
    remainingSeconds,
    currentTime,
    timerStatus,
    testMode,
    startSession,
    stopSession,
    checkTimeAndTriggerCompletion,
    setTimerStatus,
  };
};
