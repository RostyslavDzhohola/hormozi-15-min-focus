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
import { EntryData } from '@/types/entry'; // Assuming EntryData type is defined here

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
      setActivityText(''); // Reset if no entry is provided (e.g., modal closed and reopened)
    }
  }, [entry]);

  const handleSubmit = () => {
    if (activityText.trim()) {
      onSubmit(activityText.trim());
    }
  };

  if (!entry) {
    return null; // Or some placeholder/loading state if preferred
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24, // Extra padding for home indicator
      maxHeight: screenHeight * 0.5, // Limit height
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
      color: colors.text.primary,
    },
    label: {
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 8,
      marginTop: 16,
    },
    timeText: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      color: colors.text.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border.default,
      opacity: 0.7, // To indicate it's not editable
    },
    input: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border.default,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    button: {
      backgroundColor: colors.primary.main,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonText: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 16,
      color: colors.primary.contrast,
    },
    closeButton: {
      padding: 8, // Make it easier to tap
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Entry</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Time Slot (Read-only)</Text>
          <Text style={styles.timeText}>{entry.timeLabel || 'N/A'}</Text>

          <Text style={styles.label}>Activity Description</Text>
          <TextInput
            style={styles.input}
            value={activityText}
            onChangeText={setActivityText}
            placeholder="What did you accomplish?"
            placeholderTextColor={colors.text.tertiary}
            multiline
            autoFocus
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
