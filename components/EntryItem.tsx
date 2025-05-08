import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { EntryData } from '@/types/entry';

type EntryItemProps = {
  entry: EntryData;
  onDelete: () => void;
};

export function EntryItem({ entry, onDelete }: EntryItemProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDelete();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.timeContainer,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderRightWidth: 1,
            borderColor: isDark ? colors.border.subtle : '#F7F9FC',
          },
        ]}
      >
        <Text
          style={[
            styles.timeText,
            {
              color: isDark ? colors.primary.light : colors.primary.main,
            },
          ]}
        >
          {entry.timeLabel}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.entryText, { color: colors.text.primary }]}>
          {entry.text}
        </Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Trash2 size={16} color={colors.error.main} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  timeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
});
