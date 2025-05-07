import { Platform } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[BackgroundTimer]', new Date().toISOString(), ...args);
  }
}

const BACKGROUND_TIMER_TASK = 'background-timer-task';

// Define the background task outside of the registration function
TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
  try {
    log('Background task executed');
    // Your background task logic here
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    log('Background task error:', error);
    console.warn('Background task error:', error);
    return BackgroundFetch.Result.Failed;
  }
});

export async function startTimer() {
  if (Platform.OS === 'web') {
    log('Timer not started - web platform');
    return;
  }

  try {
    log('Starting timer');
    await registerBackgroundTimer();
  } catch (error) {
    log('Failed to start timer:', error);
    console.warn('Failed to start timer:', error);
  }
}

export async function stopTimer() {
  if (Platform.OS === 'web') {
    log('Timer not stopped - web platform');
    return;
  }

  try {
    log('Stopping timer');
    await unregisterBackgroundTimer();
  } catch (error) {
    log('Failed to stop timer:', error);
    console.warn('Failed to stop timer:', error);
  }
}

async function registerBackgroundTimer() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    
    // Only proceed if background fetch is available
    if (status === BackgroundFetch.BackgroundFetchResult.Available) {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TIMER_TASK);
      
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
          minimumInterval: 60 * 15, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    }
  } catch (error) {
    console.warn('Background timer registration failed:', error);
  }
}

async function unregisterBackgroundTimer() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TIMER_TASK);
    
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
    }
  } catch (error) {
    console.warn('Background timer unregistration failed:', error);
  }
}