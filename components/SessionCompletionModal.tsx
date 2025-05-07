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
  TouchableWithoutFeedback
} from 'react-native';
import { X } from 'lucide-react-native';
import { saveEntry } from '@/utils/storage';

type SessionCompletionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  currentTime: string;
};

export function SessionCompletionModal({ visible, onClose, onSubmit, currentTime }: SessionCompletionModalProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  
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
          style={styles.container}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Session Complete!</Text>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.subtitle}>
              What did you accomplish during this session?
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="I completed..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setError(null);
                }}
                multiline
                maxLength={200}
                returnKeyType="done"
              />
              <Text style={styles.characterCount}>
                {description.length}/200
              </Text>
            </View>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  !description.trim() && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={!description.trim()}
              >
                <Text style={styles.saveButtonText}>Save Entry</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
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
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
  },
});