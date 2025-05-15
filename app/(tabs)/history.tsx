import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileDown, Calendar, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/components/ThemeProvider';
import { EntryItem } from '@/components/EntryItem';
import { DaySelector } from '@/components/DaySelector';
import { useEntries } from '@/hooks/useEntries';
import { exportEntries } from '@/utils/export';
import { ManualEntryModal } from '@/components/ManualEntryModal';
import { EditEntryModal } from '@/components/EditEntryModal';
import { EntryData } from '@/types/entry';

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [entryToEditForManualModal, setEntryToEditForManualModal] =
    useState<EntryData | null>(null);

  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [currentEditingEntry, setCurrentEditingEntry] =
    useState<EntryData | null>(null);

  const { entries, deleteEntry, refreshEntries, updateEntryText } =
    useEntries(selectedDate);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      console.log(
        '[app/(tabs)/history.tsx] Screen focused. Refreshing entries for date:',
        selectedDate.toISOString().split('T')[0]
      );
      refreshEntries();

      return () => {
        // Optional: cleanup if needed when the screen loses focus
        // console.log('[HistoryScreen] Screen unfocused.');
      };
    }, [refreshEntries, selectedDate])
  );

  const handleExport = async () => {
    await exportEntries(selectedDate);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleManualEntrySubmitted = async () => {
    await refreshEntries();
    setShowManualEntryModal(false);
    setEntryToEditForManualModal(null);
  };

  const handleManualModalClose = () => {
    setShowManualEntryModal(false);
    setEntryToEditForManualModal(null);
  };

  const handleEditItemPress = (entry: EntryData) => {
    setCurrentEditingEntry(entry);
    setShowEditEntryModal(true);
  };

  const handleEditEntryModalSubmit = async (updatedText: string) => {
    if (currentEditingEntry) {
      await updateEntryText(currentEditingEntry.id, updatedText);
      setShowEditEntryModal(false);
      setCurrentEditingEntry(null);
    } else {
      console.warn('No entry was selected for editing.');
      setShowEditEntryModal(false);
    }
  };

  const handleEditEntryModalClose = () => {
    setShowEditEntryModal(false);
    setCurrentEditingEntry(null);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={colors.gradient.secondary as any}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Activity History
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border.default,
                },
              ]}
              onPress={() => setShowManualEntryModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.primary.main} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border.default,
                },
              ]}
              onPress={handleExport}
              activeOpacity={0.8}
            >
              <FileDown size={20} color={colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DaySelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      <View
        style={[
          styles.todaySummary,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.text.primary,
          },
        ]}
      >
        <View style={styles.dateContainer}>
          <Calendar size={18} color={colors.text.secondary} />
          <Text style={[styles.dateText, { color: colors.text.primary }]}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={[styles.entriesCount, { color: colors.text.secondary }]}>
          {entries.length} entries recorded
        </Text>
      </View>

      {entries.length > 0 ? (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EntryItem
              entry={item}
              onDelete={() => deleteEntry(item.id)}
              onEditPress={handleEditItemPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No entries yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Entries will appear here once you start tracking your activities.
          </Text>
        </View>
      )}

      <ManualEntryModal
        visible={showManualEntryModal}
        onClose={handleManualModalClose}
        existingEntries={entries}
        onSubmit={handleManualEntrySubmitted}
        selectedDate={selectedDate}
      />

      <EditEntryModal
        visible={showEditEntryModal}
        onClose={handleEditEntryModalClose}
        onSubmit={handleEditEntryModalSubmit}
        entry={currentEditingEntry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: '#1E293B',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginLeft: 8,
  },
  exportText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 6,
  },
  todaySummary: {
    marginTop: 8,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  entriesCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
