import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Play, CircleStop as StopCircle, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTimer } from '@/hooks/useTimer';
import { useSessionCompletionModal } from '@/components/SessionCompletionModalProvider';
import { StopSessionModal } from '@/components/StopSessionModal';
import { TimerDisplay } from '@/components/TimerDisplay';
import { LinearGradient, LinearGradientPoint } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { BugPlay, MessageSquareWarning } from 'lucide-react-native';
import { saveEntry } from '@/utils/storage';

// Track app state to suppress notifications in foreground
// const appState = useRef<AppStateStatus>(AppState.currentState); // Will be moved into component

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function TimerScreen() {
  // Moved AppState listener logic inside the component
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [showTestModeButton, setShowTestModeButton] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const progress = useSharedValue(0);
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { show: showSessionCompletionModal } = useSessionCompletionModal();

  const {
    currentTime,
    startSession,
    stopSession,
    isRunning,
    setIsRunning,
    remainingSeconds,
    timerStatus,
    setTimerStatus,
    testMode,
    checkTimeAndTriggerCompletion,
    resetTimerToNextInterval,
  } = useTimer();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTestModeButton(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isRunning && remainingSeconds === 0) {
      console.log(
        '[index.tsx] Timer naturally reached 0, calling checkTimeAndTriggerCompletion.'
      );
      checkTimeAndTriggerCompletion();
    }
  }, [isRunning, remainingSeconds, checkTimeAndTriggerCompletion]);

  useEffect(() => {
    if (timerStatus === 'completed') {
      console.log(
        "[index.tsx] timerStatus is 'completed', showing modal via context."
      );
      showSessionCompletionModal({
        currentTime,
        onSubmitCallback: handleCompletionSubmit,
      });
    }
  }, [timerStatus, currentTime, showSessionCompletionModal]);

  useEffect(() => {
    if (isRunning) {
      const totalDuration = testMode ? 5 : remainingSeconds;
      progress.value = withTiming(1 - remainingSeconds / totalDuration, {
        duration: 1000,
        easing: Easing.linear,
      });
    } else {
      progress.value = withTiming(0, { duration: 200, easing: Easing.linear });
    }
  }, [remainingSeconds, isRunning, testMode, progress]);

  useEffect(() => {
    // Check and request permissions on mount
    requestNotificationPermissions();
  }, []);

  const handleProceedToNextBlock = useCallback(() => {
    console.log('[index.tsx] Proceeding to next block (main session).');
    if (!testMode) {
      resetTimerToNextInterval();
      setIsRunning(true);
      setTimerStatus('running');
      scheduleNextBlockReminder();
    }
  }, [testMode, resetTimerToNextInterval, setIsRunning, setTimerStatus]);

  const handleNotificationInteraction = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) {
        console.log(
          '[index.tsx] handleNotificationInteraction: No response provided.'
        );
        return;
      }
      const notification = response.notification;
      const notificationData = notification.request.content.data;
      console.log(
        '[index.tsx] handleNotificationInteraction: Received response with data:',
        notificationData
      );

      if (
        notificationData &&
        (notificationData.type === 'mainSessionCompleteOSTrigger' ||
          notificationData.type === 'testModeCompleteOSTrigger')
      ) {
        console.log(
          `[index.tsx] handleNotificationInteraction: Matched type ${notificationData.type}. Stopping timer, setting status to completed, and showing modal via route param.`
        );
        setIsRunning(false);
        setTimerStatus('completed');
        // Navigate to ensure the screen is focused and trigger modal via route param as a fallback/primary mechanism
        // @ts-expect-error navigation.navigate can accept various signatures
        navigation.navigate('index', {
          action: 'showCompletionModalOnNotification',
        });
      } else {
        console.log(
          '[index.tsx] handleNotificationInteraction: Notification data type did not match or no data.'
        );
      }
    },
    [navigation, setIsRunning, setTimerStatus]
  );

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log(
          '[index.tsx] App opened by notification, handling initial response:',
          response.notification.request.content.data?.type
        );
        handleNotificationInteraction(response);
      }
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log(
          '[index.tsx] Notification response received while app is running, handling subsequent response:',
          response.notification.request.content.data?.type
        );
        handleNotificationInteraction(response);
      }
    );
    return () => {
      console.log('[index.tsx] Cleaning up notification listeners.');
      subscription.remove();
    };
  }, [handleNotificationInteraction]);

  useEffect(() => {
    const params = route.params as { action?: string } | undefined;
    if (params?.action === 'showCompletionModalOnNotification') {
      console.log(
        "[index.tsx] useEffect[route.params.action]: Detected 'showCompletionModalOnNotification' action param."
      );
      // Ensure timer is stopped and status is completed before showing modal
      setIsRunning(false);
      setTimerStatus('completed'); // This will trigger the useEffect[timerStatus] to show modal
      // setShowCompletionModal(true); // Direct call, or rely on useEffect[timerStatus]
      // @ts-expect-error navigation.setParams expects params of the current route.
      navigation.setParams({ action: null });
    }
  }, [
    route.params,
    navigation,
    setIsRunning,
    setTimerStatus,
    showSessionCompletionModal,
  ]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    setNotificationPermission(status === 'granted');
    if (status !== 'granted') {
      console.warn('[index.tsx] Notification permissions not granted.');
      // Optionally show a message if permission is denied but don't block functionality
    }
  };

  // Define a consistent channel ID
  const CRITICAL_CHANNEL_ID = 'sessionCompleteCritical';

  // Function to configure the notification channel on Android
  const ensureCriticalNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CRITICAL_CHANNEL_ID, {
        name: 'Critical Session Alerts',
        importance: Notifications.AndroidImportance.MAX, // Highest importance
        bypassDnd: true, // Attempt to bypass Do Not Disturb
        sound: 'default', // Use default sound
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC, // Show on lockscreen
        vibrationPattern: [0, 250, 250, 250], // Standard vibration
      });
      console.log(
        '[index.tsx] Ensured critical notification channel exists on Android.'
      );
    }
  };

  const scheduleDelayedNotificationForTestMode = async (seconds: number) => {
    console.log(
      `[index.tsx] scheduleDelayedNotificationForTestMode: Attempting with ${seconds}s delay...`
    );
    try {
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        status = newStatus;
      }
      if (status !== 'granted') {
        console.warn(
          '[index.tsx] scheduleDelayedNotificationForTestMode: Permission still not granted.'
        );
        alert(
          'Notification permission is required for test mode. Please enable it.'
        );
        return;
      }

      // Ensure the channel is configured before scheduling (Android)
      await ensureCriticalNotificationChannel();
      await Notifications.cancelAllScheduledNotificationsAsync(); // Cancel previous test notifications

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Mode Complete!',
          body: 'Your 5-second test session has finished.',
          data: { type: 'testModeCompleteOSTrigger' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds,
          repeats: false,
        },
      });
      console.log(
        `[index.tsx] scheduleDelayedNotificationForTestMode: Critical notification scheduled with ${seconds}s delay via OS.`
      );
    } catch (error) {
      console.error(
        '[index.tsx] scheduleDelayedNotificationForTestMode: Error scheduling notification:',
        error
      );
      alert('Failed to schedule test mode completion notification.');
    }
  };

  const scheduleNextBlockReminder = async () => {
    console.log(
      '[index.tsx] scheduleNextBlockReminder: Attempting to schedule next reminder...'
    );
    try {
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log(
          '[index.tsx] scheduleNextBlockReminder: Permission not granted, requesting...'
        );
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        console.warn(
          '[index.tsx] scheduleNextBlockReminder: Permission still not granted.'
        );
        alert(
          'Notification permission is required for session reminders. Please enable it in settings.'
        );
        return;
      }

      // Ensure the channel is configured before scheduling (Android)
      await ensureCriticalNotificationChannel();
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log(
        '[index.tsx] scheduleNextBlockReminder: Cancelled all previously scheduled notifications.'
      );

      const now = new Date();
      let notificationDate = new Date(now);
      notificationDate.setSeconds(0, 0);

      const currentMinutes = now.getMinutes();
      const minutesPastLastQuarter = currentMinutes % 15;

      if (
        minutesPastLastQuarter === 0 &&
        now.getSeconds() === 0 &&
        now.getMilliseconds() === 0
      ) {
        notificationDate.setMinutes(currentMinutes + 15);
      } else {
        notificationDate.setMinutes(
          currentMinutes - minutesPastLastQuarter + 15
        );
      }

      if (notificationDate.getTime() <= Date.now()) {
        console.log(
          `[app/(tabs)/index.tsx] scheduleNextBlockReminder: Calculated notification time is in the past (${notificationDate.toLocaleString()}), adjusting.`
        );
        notificationDate.setMinutes(notificationDate.getMinutes() + 15);
      }

      // Schedule main session completion notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Session Complete!',
          body: 'Your 15-minute session has finished.',
          data: { type: 'mainSessionCompleteOSTrigger' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
      });
      console.log(
        `[app/(tabs)/index.tsx] scheduleNextBlockReminder: Notification scheduled at ${notificationDate.toLocaleString()}.`
      );
    } catch (error) {
      console.error(
        '[app/(tabs)/index.tsx] scheduleNextBlockReminder: Error scheduling reminder:',
        error
      );
      alert('Failed to schedule session reminder.');
    }
  };

  const handleStartSession = () => {
    console.log('[app/(tabs)/index.tsx] Handling Start Session (main).');
    startSession(false);
    scheduleNextBlockReminder();
  };

  const handleTestSession = () => {
    console.log('[app/(tabs)/index.tsx] Handling Start Session (test).');
    const initialTestSeconds = startSession(true);
    if (typeof initialTestSeconds === 'number') {
      scheduleDelayedNotificationForTestMode(initialTestSeconds);
    } else {
      scheduleDelayedNotificationForTestMode(5);
      console.warn(
        '[app/(tabs)/index.tsx] handleTestSession: initialTestSeconds from useTimer was not a number, defaulting to 5s for notification.'
      );
    }
  };

  const confirmStopSession = () => {
    setShowStopConfirmation(true);
  };

  const handleStopConfirmed = async () => {
    console.log('[app/(tabs)/index.tsx] Handling Stop Confirmed.');
    stopSession();
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log(
        '[app/(tabs)/index.tsx] handleStopConfirmed: All scheduled notifications cancelled.'
      );
    } catch (error) {
      console.error(
        '[app/(tabs)/index.tsx] handleStopConfirmed: Error cancelling notifications:',
        error
      );
    }
    setShowStopConfirmation(false);
  };

  const handleCompletionSubmit = useCallback(
    (entryText?: string) => {
      console.log('[app/(tabs)/index.tsx] Handling Completion Submit.');
      if (entryText && entryText.trim().length > 0 && !testMode) {
        saveEntry({
          id: Date.now().toString(),
          text: entryText.trim(),
          timestamp: new Date().toISOString(),
          timeLabel: currentTime,
        });
        console.log(
          '[app/(tabs)/index.tsx] Entry saved for main session:',
          entryText.trim()
        );
      }
      if (!testMode) {
        handleProceedToNextBlock();
      } else {
        setTimerStatus('idle');
        setIsRunning(false);
      }
    },
    [
      testMode,
      currentTime,
      handleProceedToNextBlock,
      setTimerStatus,
      setIsRunning,
      saveEntry,
    ]
  );

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${progress.value * 360}deg` }],
    };
  });

  const gradientColors =
    Array.isArray(colors.gradient.primary) &&
    colors.gradient.primary.length >= 2
      ? (colors.gradient.primary as [string, string, ...string[]])
      : (['transparent', 'transparent'] as [string, string, ...string[]]);

  useEffect(() => {
    // Listener for when a notification is received while the app is running
    const notificationReceivedSubscription =
      Notifications.addNotificationReceivedListener(async (notification) => {
        console.log(
          '[app/(tabs)/index.tsx] Notification received while app running:',
          notification.request.content.data?.type
        );
        // Check if the app is currently active/foreground
        if (appState.current === 'active') {
          const notificationType = notification.request.content.data?.type;
          if (
            notificationType === 'testModeCompleteOSTrigger' ||
            notificationType === 'mainSessionCompleteOSTrigger'
          ) {
            console.log(
              `[app/(tabs)/index.tsx] App is active. Scheduling dismissal for notification ${notification.request.identifier} of type ${notificationType} from notification center after banner.`
            );
            // Delay slightly to ensure banner has time to show, then dismiss.
            // This makes the notification "non-persistent" in the tray when the app is open.
            setTimeout(async () => {
              try {
                await Notifications.dismissNotificationAsync(
                  notification.request.identifier
                );
                console.log(
                  `[app/(tabs)/index.tsx] Successfully dismissed notification: ${notification.request.identifier}`
                );
              } catch (error) {
                console.error(
                  `[app/(tabs)/index.tsx] Error dismissing notification ${notification.request.identifier}:`,
                  error
                );
              }
            }, 4500); // Adjusted delay to 4.5 seconds
          }
        }
      });

    return () => {
      console.log(
        '[app/(tabs)/index.tsx] Cleaning up notification received listener.'
      );
      notificationReceivedSubscription.remove();
    };
  }, []); // appState.current is a ref, so it doesn't need to be in deps.

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="dark" />

      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 } as LinearGradientPoint}
        end={{ x: 1, y: 1 } as LinearGradientPoint}
      />

      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Time Tracker
        </Text>
        {__DEV__ && showTestModeButton && !isRunning && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.surface }]}
              onPress={handleTestSession}
            >
              <BugPlay size={16} color={colors.text.secondary} />
              <Text
                style={[
                  styles.testButtonText,
                  { color: colors.text.secondary },
                ]}
              >
                Test Mode (5s)
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Track your productivity in 15-minute intervals
        </Text>
        {/* Conditionally render permission warning */}
        {!notificationPermission && Platform.OS !== 'web' && (
          <View
            style={[
              styles.permissionDeniedContainer,
              {
                backgroundColor: colors.warning.light,
                borderColor: colors.warning.border,
              },
            ]}
          >
            <MessageSquareWarning size={24} color={colors.warning.main} />
            <Text
              style={[
                styles.permissionDeniedText,
                { color: colors.warning.main },
              ]}
            >
              Notifications are disabled. You might miss session completion
              alerts. Please enable them in system settings.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.timerShadow}>
          <View
            style={[
              styles.timerBorder,
              {
                backgroundColor: colors.surface,
                borderColor:
                  colors.border?.default ||
                  String(colors.border) ||
                  colors.surface,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressCircle,
                animatedCircleStyle,
                {
                  borderLeftColor: colors.primary.main,
                  borderTopColor: colors.primary.main,
                },
              ]}
            />
            <View style={styles.timerContent}>
              <TimerDisplay
                minutes={Math.floor(remainingSeconds / 60)}
                seconds={remainingSeconds % 60}
                isActive={isRunning}
                testMode={testMode}
              />
              <Text
                style={[
                  styles.currentTimeText,
                  { color: colors.text.secondary },
                ]}
              >
                {currentTime}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {!isRunning && timerStatus !== 'completed' ? (
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor: colors.primary.main,
                shadowColor: colors.primary.main,
              },
            ]}
            onPress={handleStartSession}
            activeOpacity={0.8}
          >
            <Play size={24} color={colors.primary.contrast} />
            <Text
              style={[styles.buttonText, { color: colors.primary.contrast }]}
            >
              Start Session
            </Text>
          </TouchableOpacity>
        ) : isRunning ? (
          <TouchableOpacity
            style={[
              styles.stopButton,
              {
                backgroundColor: colors.error.light,
                borderColor: colors.error.border,
              },
            ]}
            onPress={confirmStopSession}
            activeOpacity={0.8}
          >
            <StopCircle size={24} color={colors.error.main} />
            <Text style={[styles.stopButtonText, { color: colors.error.main }]}>
              Stop Session
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <StopSessionModal
        visible={showStopConfirmation}
        onClose={() => setShowStopConfirmation(false)}
        onConfirm={handleStopConfirmed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 6,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  timerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  timerBorder: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 10,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  progressCircle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderWidth: 10,
    borderLeftColor: '#3B82F6',
    borderTopColor: '#3B82F6',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRadius: 120,
    transform: [{ rotate: '0deg' }],
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 8,
  },
  controlsContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stopButton: {
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  stopButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  permissionDeniedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  permissionDeniedText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
});
