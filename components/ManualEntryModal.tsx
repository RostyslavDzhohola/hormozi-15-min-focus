import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { saveEntry } from '@/utils/storage';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react-native';
import { EntryData, TimeSlot } from '@/types/entry';
import { TimeSlotItem } from './TimeSlotItem';
import { useTheme } from '@/components/ThemeProvider';

const TIME_SLOTS: TimeSlot[] = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return {
    value: `${hour12}:${minute.toString().padStart(2, '0')} ${period}`,
    label: `${hour12}:${minute.toString().padStart(2, '0')} ${period}`,
    timestamp: new Date().setHours(hour, minute, 0, 0),
  };
});

type ManualEntryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  existingEntries: EntryData[];
  selectedDate: Date;
};

export function ManualEntryModal({
  visible,
  onClose,
  onSubmit,
  existingEntries,
  selectedDate,
}: ManualEntryModalProps) {
  const [entry, setEntry] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const inputRef = useRef<TextInput>(null);
  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const { colors } = useTheme();

  useEffect(() => {
    if (!visible) {
      setEntry('');
      setSelectedTime(null);
      setError(null);
      setShowTimePicker(false);
      setAvailableTimeSlots([]);
      scrollY.value = 0;
    }
  }, [visible, scrollY]);

  useEffect(() => {
    if (!visible) return;

    const takenSlots = new Set(existingEntries.map((entry) => entry.timeLabel));

    const filteredSlots = TIME_SLOTS.filter((slot) => {
      if (takenSlots.has(slot.value)) return false;
      return true;
    });

    setAvailableTimeSlots(filteredSlots);

    if (
      filteredSlots.length > 0 &&
      (!selectedTime || !filteredSlots.some((s) => s.value === selectedTime))
    ) {
      const latestAvailable = filteredSlots[filteredSlots.length - 1].value;
      setSelectedTime(latestAvailable);
    } else if (filteredSlots.length === 0) {
      setSelectedTime(null);
    }
  }, [visible, existingEntries, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedTime) {
      setError('Please select a time slot');
      return;
    }
    if (!entry.trim()) {
      setError('Please enter an activity description');
      return;
    }

    try {
      setError(null);

      // Create a new date object from the selected date to avoid modifying the original
      const entryDate = new Date(selectedDate);

      // Parse the selected time
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);

      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12;
      else if (period === 'AM' && hour === 12) hour = 0;

      // Set the correct hours and minutes on our entry date
      entryDate.setHours(hour, parseInt(minutes), 0, 0);

      await saveEntry({
        id: Date.now().toString(),
        text: entry.trim(),
        timestamp: entryDate.toISOString(),
        timeLabel: selectedTime,
      });

      await onSubmit();
      onClose();
    } catch (err) {
      setError('Failed to save entry. Please try again.');
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          if (!showTimePicker) {
            Keyboard.dismiss();
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        >
          <View style={[styles.content, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Add Manual Entry
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.scrollView}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Select Time Slot
              </Text>

              <TouchableOpacity
                style={[
                  styles.timePickerTrigger,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border.default,
                  },
                ]}
                onPress={() => setShowTimePicker(!showTimePicker)}
              >
                <Text
                  style={[
                    styles.selectedTimeText,
                    { color: colors.text.primary },
                  ]}
                >
                  {selectedTime || 'Select a time'}
                </Text>
                {showTimePicker ? (
                  <ChevronUp size={20} color={colors.text.secondary} />
                ) : (
                  <ChevronDown size={20} color={colors.text.secondary} />
                )}
              </TouchableOpacity>

              {showTimePicker && (
                <Animated.ScrollView
                  ref={scrollViewRef}
                  style={[
                    styles.timePickerContainer,
                    { backgroundColor: colors.background },
                  ]}
                  showsVerticalScrollIndicator={false}
                  onScroll={scrollHandler}
                  scrollEventThrottle={16}
                  snapToInterval={50}
                  decelerationRate="fast"
                >
                  {availableTimeSlots.map((slot, index) => (
                    <TimeSlotItem
                      key={slot.value}
                      slot={slot}
                      index={index}
                      scrollY={scrollY}
                      isSelected={selectedTime === slot.value}
                      onPress={() => {
                        setSelectedTime(slot.value);
                        setShowTimePicker(false);
                      }}
                    />
                  ))}
                </Animated.ScrollView>
              )}

              <Text style={[styles.label, { color: colors.text.primary }]}>
                Activity Description
              </Text>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    color: colors.text.primary,
                    backgroundColor: colors.background,
                    borderColor: colors.border.default,
                  },
                ]}
                placeholder="What did you accomplish?"
                placeholderTextColor={colors.text.tertiary}
                value={entry}
                onChangeText={(text) => {
                  setEntry(text);
                  setError(null);
                }}
                multiline
                maxLength={300}
              />

              {error && (
                <Text style={[styles.errorText, { color: colors.error.main }]}>
                  {error}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary.main,
                    opacity: !selectedTime || !entry.trim() ? 0.5 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={!selectedTime || !entry.trim()}
              >
                <Plus size={20} color={colors.primary.contrast} />
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: colors.primary.contrast },
                  ]}
                >
                  Add Entry
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    marginTop: 'auto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    padding: 20,
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectedTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  timePickerContainer: {
    maxHeight: 200,
    marginBottom: 24,
    borderRadius: 12,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
});
