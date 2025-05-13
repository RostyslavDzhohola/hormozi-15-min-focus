import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/components/ThemeProvider';

type StopSessionModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function StopSessionModal({
  visible,
  onClose,
  onConfirm,
}: StopSessionModalProps) {
  const { colors } = useTheme();

  // Add escape key listener for web
  React.useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
      >
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={32} color={colors.warning.main} />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            Stop Session?
          </Text>

          <Text style={[styles.message, { color: colors.text.secondary }]}>
            Are you sure you want to stop the current tracking session? This
            will end your daily activity tracking.
          </Text>

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
                styles.confirmButton,
                {
                  backgroundColor: colors.error.light,
                  borderColor: colors.error.border,
                },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={[styles.confirmButtonText, { color: colors.error.main }]}
              >
                Stop Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
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
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});
