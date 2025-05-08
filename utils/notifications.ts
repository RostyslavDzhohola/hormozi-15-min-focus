import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

// Initialize audio
Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
});

// Request notifications permissions
export async function requestPermissionsAsync() {
  if (Platform.OS === 'web') {
    return; // Notifications not supported on web
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
  });

  if (status !== 'granted') {
    console.log('Notification permission not granted');
  }
}

// Schedule a notification for now
export async function scheduleNotificationAsync() {
  if (Platform.OS === 'web') {
    return; // Notifications not supported on web
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to track your progress!',
        body: 'What did you accomplish in the last 15 minutes?',
        priority: 'high',
        sound: 'default',
        sticky: true,
        data: { type: 'entry_reminder' },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Still show notification even if sound fails
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to track your progress!',
        body: 'What did you accomplish in the last 15 minutes?',
        priority: 'high',
        sound: 'default',
        sticky: true,
        data: { type: 'entry_reminder' },
      },
      trigger: null,
    });
  }
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotificationsAsync() {
  if (Platform.OS === 'web') {
    return; // Notifications not supported on web
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}
