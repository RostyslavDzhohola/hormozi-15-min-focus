import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';

type DaySelectorProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

export function DaySelector({ selectedDate, onDateChange }: DaySelectorProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    onDateChange(previousDay);
  };
  
  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Don't allow selecting future dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (nextDay < tomorrow) {
      onDateChange(nextDay);
    }
  };
  
  const handleSelectToday = () => {
    onDateChange(new Date());
  };
  
  // Check if next button should be disabled (can't select future dates)
  const isNextDisabled = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return selectedDate >= today;
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.arrowButton, { backgroundColor: 'transparent' }]} 
        onPress={handlePreviousDay}
      >
        <ChevronLeft size={24} color={colors.text.secondary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.dateContainer,
          { backgroundColor: isDark ? colors.surface : colors.border.subtle },
          isToday(selectedDate) && {
            backgroundColor: colors.primary.main
          }
        ]}
        onPress={handleSelectToday}
      >
        <Text 
          style={[
            styles.dateText, 
            { color: colors.text.primary },
            isToday(selectedDate) && { color: colors.primary.contrast }
          ]}
        >
          {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.arrowButton,
          { backgroundColor: 'transparent' },
          isNextDisabled() && styles.disabledButton
        ]} 
        onPress={handleNextDay}
        disabled={isNextDisabled()}
      >
        <ChevronRight 
          size={24} 
          color={isNextDisabled() ? colors.text.tertiary : colors.text.secondary} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  arrowButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  dateContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});