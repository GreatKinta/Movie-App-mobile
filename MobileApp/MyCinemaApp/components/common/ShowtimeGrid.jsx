import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const ShowtimeGrid = ({ showtimes }) => {
  const router = useRouter();

  const handleSelect = useCallback(
    (showtime) => {
      const showtimeId = showtime.showtimeId || showtime.id;
      if (!showtimeId) {
          console.warn("Lỗi: Không tìm thấy ID của suất chiếu", showtime);
          return;
      }
      router.push(`/booking/${showtimeId}`);
    },
    [router]
  );

  if (!showtimes || showtimes.length === 0) {
    return (
      <Text style={styles.empty}>Không có lịch chiếu.</Text>
    );
  }

  return (
    <View style={styles.grid}>
      {showtimes.map((item, index) => {
        // Handle both mock object and real backend DateTime format
        const timeDisplay = item.time || (item.startTime ? new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A');
        
        // Khóa nếu có cờ isLocked từ API, hoặc nếu đã qua thời gian bắt đầu quá 15 phút
        const isLocked = item.isLocked || (item.startTime && new Date() > new Date(new Date(item.startTime).getTime() + 15 * 60 * 1000));

        return (
          <Pressable
            key={index}
            onPress={() => !isLocked && handleSelect(item)}
            disabled={isLocked}
            style={({ pressed }) => [
              styles.card,
              pressed && !isLocked && styles.cardPressed,
              isLocked && styles.cardLocked,
            ]}
            accessibilityLabel={`Suất chiếu ${timeDisplay}${isLocked ? ' (Đã khóa)' : ''}`}
            accessibilityRole="button"
          >
            <Text style={[styles.time, isLocked && styles.textLocked]}>{timeDisplay}</Text>
            <Text style={[styles.seats, isLocked && styles.textLocked]}>
              {isLocked ? 'Đã khóa' : (item.roomName || `${item.seats} ghế`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  card: {
    width: 100,
    paddingVertical: 12,
    backgroundColor: Colors.bgWhite,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadows.card,
  },
  cardPressed: {
    backgroundColor: Colors.brandRed,
    borderColor: Colors.brandRed,
    transform: [{ scale: 0.95 }],
  },
  cardLocked: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  textLocked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  time: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    color: Colors.textPrimary,
  },
  seats: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  empty: {
    marginTop: 20,
    fontStyle: 'italic',
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});

export default ShowtimeGrid;
