import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/components/ThemeProvider';
import { EntryData } from '@/types/entry';

interface EditEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (updatedText: string) => void;
  entry: EntryData | null;
}

const screenHeight = Dimensions.get('window').height;

export function EditEntryModal({
  visible,
  onClose,
  onSubmit,
  entry,
}: EditEntryModalProps) {
  const [activityText, setActivityText] = useState('');
  const { colors } = useTheme();

  useEffect(() => {
    if (entry) {
      setActivityText(entry.text);
    } else {
      setActivityText('');
    }
  }, [entry]);

  const handleSubmit = () => {
    if (activityText.trim()) {
      onSubmit(activityText.trim());
    }
  };

  if (!entry) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Edit Entry
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text.secondary }]}>
            Time Slot (Read-only)
          </Text>
          <Text
            style={[
              styles.timeText,
              {
                color: colors.text.primary,
                backgroundColor: colors.background,
                borderColor: colors.border.default,
              },
            ]}
          >
            {entry.timeLabel || 'N/A'}
          </Text>

          <Text style={[styles.label, { color: colors.text.secondary }]}>
            Activity Description
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text.primary,
                backgroundColor: colors.background,
                borderColor: colors.border.default,
              },
            ]}
            value={activityText}
            onChangeText={setActivityText}
            placeholder="What did you accomplish?"
            placeholderTextColor={colors.text.tertiary}
            multiline
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary.main }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.buttonText, { color: colors.primary.contrast }]}
            >
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: screenHeight * 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    opacity: 0.7,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  closeButton: {
    padding: 8,
  },
});
