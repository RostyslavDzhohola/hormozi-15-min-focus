import React, { useState, useRef, useEffect } from 'react';
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
import { saveEntry } from '@/utils/storage';
import * as Haptics from 'expo-haptics';

type EntryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (entry: string) => void;
  currentTime: string;
};

export function EntryModal({
  visible,
  onClose,
  onSubmit,
  currentTime,
}: EntryModalProps) {
  const [entry, setEntry] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Focus the text input when modal becomes visible
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);

      // Vibrate to get user's attention if on a device
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      // Clear the input when modal is closed
      setEntry('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (entry.trim().length > 0) {
      // Save the entry
      saveEntry({
        id: Date.now().toString(),
        text: entry.trim(),
        timestamp: new Date().toISOString(),
        timeLabel: currentTime,
      });

      // Notify parent component
      onSubmit(entry);

      // Clear the input
      setEntry('');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>What did you accomplish?</Text>
              <Text style={styles.subtitle}>Time period: {currentTime}</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="I worked on..."
                placeholderTextColor="#94A3B8"
                value={entry}
                onChangeText={setEntry}
                multiline
                numberOfLines={4}
                maxLength={300}
                autoFocus={Platform.OS === 'web'}
              />
              <Text style={styles.characterCount}>{entry.length}/300</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  entry.trim().length === 0 && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={entry.trim().length === 0}
              >
                <Text style={styles.submitButtonText}>Save</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748B',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  characterCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
  },
});
