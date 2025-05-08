import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Play, CircleStop as StopCircle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTimer } from '@/hooks/useTimer';
import { SessionCompletionModal } from '@/components/SessionCompletionModal';
import { StopSessionModal } from '@/components/StopSessionModal';
import { scheduleNotificationAsync } from '@/utils/notifications';
import { TimerDisplay } from '@/components/TimerDisplay';
import { useNotifications } from '@/hooks/useNotifications';
import { LinearGradient, LinearGradientPoint } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { BugPlay, Bell, MessageSquareWarning } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

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
  foregroundNotificationButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  foregroundNotificationButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});

export default function TimerScreen() {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [showTestModeButton, setShowTestModeButton] = useState(false);
  const progress = useSharedValue(0);
  const { colors } = useTheme();

  const {
    currentTime,
    startSession,
    stopSession,
    isRunning,
    remainingSeconds,
    timerStatus,
    setTimerStatus,
    testMode,
    checkTimeAndTriggerCompletion,
  } = useTimer();

  const { setupNotifications, permissionDeniedMessage } = useNotifications(
    () => {
      setShowCompletionModal(true);
    }
  );

  useEffect(() => {
    setupNotifications();
    const timer = setTimeout(() => {
      setShowTestModeButton(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [setupNotifications]);

  useEffect(() => {
    if (isRunning) {
      checkTimeAndTriggerCompletion();
    }
  }, [isRunning, remainingSeconds, checkTimeAndTriggerCompletion, testMode]);

  useEffect(() => {
    if (timerStatus === 'completed') {
      setShowCompletionModal(true);
      scheduleNotificationAsync();
    }
  }, [timerStatus]);

  useEffect(() => {
    if (isRunning) {
      const totalDuration = testMode ? 5 : 900;
      progress.value = withTiming(1 - remainingSeconds / totalDuration, {
        duration: 1000,
        easing: Easing.linear,
      });
    } else {
      progress.value = withTiming(0, { duration: 200, easing: Easing.linear });
    }
  }, [remainingSeconds, isRunning, testMode, progress]);

  const handleStartSession = () => {
    startSession(false);
  };

  const handleTestSession = () => {
    startSession(true);
  };

  const confirmStopSession = () => {
    setShowStopConfirmation(true);
  };

  const handleStopConfirmed = () => {
    stopSession();
    setShowStopConfirmation(false);
  };

  const handleCompletionSubmit = () => {
    setShowCompletionModal(false);
    setTimerStatus('idle');
  };

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
        {showTestModeButton && !isRunning && (
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

        <TouchableOpacity
          style={styles.foregroundNotificationButton}
          onPress={async () => {
            try {
              console.log(
                'Attempting to schedule a foreground test notification...'
              );
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Foreground Test!',
                  body: 'Does this notification show up immediately?',
                  sound: 'default',
                },
                trigger: null,
              });
              console.log('Foreground test notification scheduled.');
            } catch (e) {
              console.error(
                'Failed to schedule foreground test notification:',
                e
              );
            }
          }}
        >
          <MessageSquareWarning size={18} color="white" />
          <Text style={styles.foregroundNotificationButtonText}>
            Test FG Notification
          </Text>
        </TouchableOpacity>
      </View>

      {permissionDeniedMessage && (
        <View
          style={[
            styles.permissionDeniedContainer,
            {
              backgroundColor: colors.error.light,
              borderColor: colors.error.border,
            },
          ]}
        >
          <Bell size={20} color={colors.error.main} />
          <Text
            style={[styles.permissionDeniedText, { color: colors.error.main }]}
          >
            {permissionDeniedMessage}
          </Text>
        </View>
      )}

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
        {!isRunning ? (
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
        ) : (
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
        )}
      </View>

      <View style={styles.statusContainer}>
        {isRunning ? (
          <Text style={[styles.statusText, { color: colors.text.secondary }]}>
            Session active • Next entry in {Math.floor(remainingSeconds / 60)}:
            {(remainingSeconds % 60).toString().padStart(2, '0')}
          </Text>
        ) : (
          <Text style={[styles.statusText, { color: colors.text.secondary }]}>
            Session inactive • Start to begin tracking
          </Text>
        )}
      </View>

      <SessionCompletionModal
        visible={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          setTimerStatus('idle');
        }}
        onSubmit={handleCompletionSubmit}
        currentTime={currentTime}
      />

      <StopSessionModal
        visible={showStopConfirmation}
        onClose={() => setShowStopConfirmation(false)}
        onConfirm={handleStopConfirmed}
      />
    </SafeAreaView>
  );
}
