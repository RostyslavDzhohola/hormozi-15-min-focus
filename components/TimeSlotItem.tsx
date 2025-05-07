import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
  Extrapolate,
} from 'react-native-reanimated';
import { TimeSlot } from '@/types/entry';

type TimeSlotItemProps = {
  slot: TimeSlot;
  index: number;
  scrollY: SharedValue<number>;
  isSelected: boolean;
  onPress: () => void;
};

export function TimeSlotItem({
  slot,
  index,
  scrollY,
  isSelected,
  onPress,
}: TimeSlotItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemHeight = 50;
    const inputRange = [
      (index - 2) * itemHeight,
      (index - 1) * itemHeight,
      index * itemHeight,
      (index + 1) * itemHeight,
      (index + 2) * itemHeight,
    ];
    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.8, 0.9, 1, 0.9, 0.8],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [0.6, 0.8, 1, 0.8, 0.6],
      Extrapolate.CLAMP
    );
    return { transform: [{ scale }], opacity };
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View
        style={[
          styles.timeSlot,
          isSelected && styles.selectedTimeSlot,
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.timeSlotText,
            isSelected && styles.selectedTimeSlotText,
          ]}
        >
          {slot.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  timeSlot: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  timeSlotText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748B',
  },
  selectedTimeSlot: {
    backgroundColor: '#EFF6FF',
  },
  selectedTimeSlotText: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
});