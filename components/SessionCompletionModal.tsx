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
import { X } from 'lucide-react-native';
import { saveEntry } from '@/utils/storage';
import { useTheme } from '@/components/ThemeProvider';

type SessionCompletionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  currentTime: string;
};

export function SessionCompletionModal({
  visible,
  onClose,
  onSubmit,
  currentTime,
}: SessionCompletionModalProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      // Focus the text input when modal becomes visible
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      // Add escape key listener for web
      if (Platform.OS === 'web') {
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
      } else {
        return () => clearTimeout(focusTimer);
      }
    } else {
      // Clear input when modal is closed
      setDescription('');
      setError(null);
    }
  }, [visible, onClose]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please enter a description of your session');
      return;
    }

    try {
      // Save the entry
      await saveEntry({
        id: Date.now().toString(),
        text: description.trim(),
        timestamp: new Date().toISOString(),
        timeLabel: currentTime,
      });

      // Clear and close
      setDescription('');
      setError(null);
      onSubmit();
      onClose();
    } catch (err) {
      setError('Failed to save entry. Please try again.');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        >
          <View style={[styles.content, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Session Complete!
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              What did you accomplish during this session?
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border.default,
                    color: colors.text.primary,
                  },
                ]}
                placeholder="I completed..."
                placeholderTextColor={colors.text.tertiary}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setError(null);
                }}
                multiline
                maxLength={200}
                returnKeyType="done"
              />
              <Text
                style={[styles.characterCount, { color: colors.text.tertiary }]}
              >
                {description.length}/200
              </Text>
            </View>

            {error && (
              <Text style={[styles.errorText, { color: colors.error.main }]}>
                {error}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: colors.border.subtle },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.text.secondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary.main,
                    opacity: !description.trim() ? 0.5 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={!description.trim()}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: colors.primary.contrast },
                  ]}
                >
                  Save Entry
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
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
  },
  characterCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});
