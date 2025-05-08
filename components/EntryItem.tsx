import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { EntryData } from '@/types/entry';

interface EntryItemProps {
  entry: EntryData;
  onDelete: (id: string) => void;
  onEditPress: (entry: EntryData) => void;
}

export function EntryItem({ entry, onDelete, onEditPress }: EntryItemProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDelete(entry.id);
  };

  const displayTime = entry.timeLabel || 'N/A';
  const displayText = entry.text || 'No description';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={() => onEditPress(entry)}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.timeText,
            { color: colors.primary?.main || colors.text.primary },
          ]}
        >
          {displayTime}
        </Text>
        <Text
          style={[styles.text, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {displayText}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteButtonContainer}
      >
        <Trash2 size={20} color={colors.error?.main || '#EF4444'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  },
  deleteButtonContainer: {
    padding: 8,
  },
});
