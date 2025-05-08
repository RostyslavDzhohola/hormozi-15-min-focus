import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  useSharedValue,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

type TimerDisplayProps = {
  minutes: number;
  seconds: number;
  isActive?: boolean;
  testMode?: boolean;
};

export function TimerDisplay({
  minutes,
  seconds,
  isActive,
  testMode,
}: TimerDisplayProps) {
  const scale = useSharedValue(1);

  // Apply pulse animation when timer is about to end
  React.useEffect(() => {
    if (isActive && minutes === 0 && seconds <= 10) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: 500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [minutes, seconds]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Format minutes and seconds with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  // Show 00:00 when inactive
  const displayMinutes = isActive ? formattedMinutes : '00';
  const displaySeconds = isActive ? formattedSeconds : '00';

  // Determine color based on remaining time
  const getTimerColor = () => {
    if (!isActive) return '#94A3B8'; // Gray color when inactive
    if (minutes === 0 && seconds <= 10) {
      return testMode ? '#F97316' : '#EF4444'; // Orange for test mode, red for normal mode
    } else if (minutes === 0 && seconds <= 30) {
      return '#F97316'; // Orange for last 30 seconds
    } else {
      return '#3B82F6'; // Default blue
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {testMode && (
        <View style={styles.testModeBadge}>
          <Text style={styles.testModeText}>TEST MODE</Text>
        </View>
      )}
      <Text style={[styles.timerText, { color: getTimerColor() }]}>
        {displayMinutes}:{displaySeconds}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 48,
  },
  testModeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  testModeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#F97316',
  },
});
