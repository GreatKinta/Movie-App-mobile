import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';

const DateSelector = ({ days, activeTab, onTabChange }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day) => {
        const isActive = activeTab === day.id;
        return (
          <Pressable
            key={day.id}
            onPress={() => onTabChange(day.id)}
            style={[styles.dateItem, isActive && styles.dateItemActive]}
            accessibilityLabel={`Ngày ${day.dayNumber}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.dayNumber, isActive && styles.dayNumberActive]}>
              {day.dayNumber}
            </Text>
            <Text style={[styles.monthYear, isActive && styles.monthYearActive]}>
              {day.monthYear}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  dateItem: {
    width: 72,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayNumber: {
    fontSize: 22,
    fontFamily: 'Inter_800ExtraBold',
    color: Colors.textPrimary,
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  monthYear: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  monthYearActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});

export default DateSelector;
