import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { requestPermissionsAsync } from '@/utils/notifications';
import { useSettings } from './useSettings';

export function useNotifications(onNotificationReceived: () => void) {
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState<string | null>(null);
  const { settings } = useSettings();
  
  const setupNotifications = useCallback(async () => {
    if (Platform.OS === 'web') {
      return; // Notifications not supported on web
    }

    // Don't check permissions if notifications are disabled in settings
    if (!settings.notificationsEnabled) {
      setPermissionDeniedMessage(null);
      return;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      if (status !== 'granted') {
        console.log('Notification permission not granted');
        setPermissionDeniedMessage('Please enable notifications in your device settings to receive reminders when your session is complete.');
        return;
      } else {
        setPermissionDeniedMessage(null);
      }
    }
    
    // Handle notification response
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      onNotificationReceived();
    });
    
    // Handle notification response when app is not focused
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (response.notification.request.content.data.type === 'entry_reminder') {
          // Navigate to timer screen and show completion modal
          router.push('/(tabs)');
          onNotificationReceived();
        }
      }
    );
    
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [onNotificationReceived]);
  
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (Platform.OS !== 'web') {
      setupNotifications().then(cleanupFn => {
        cleanup = cleanupFn;
      });
    }
    
    // Clean up on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [setupNotifications, settings.notificationsEnabled]);
  
  return { setupNotifications, permissionDeniedMessage };
}