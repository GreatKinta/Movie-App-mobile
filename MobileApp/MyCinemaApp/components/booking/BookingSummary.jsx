import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Button from '../common/Button';
import { Colors, Shadows } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const BookingSummary = ({
  movie,
  selectedSeats,
  totalPrice,
  onConfirm,
  isLoading,
  error,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: movie.moviePoster || movie.poster }}
          style={styles.poster}
          contentFit="cover"
        />
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
          <View style={styles.formatBadge}>
             <Text style={styles.formatText}>{movie.type || '2D'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.label}>Thể loại</Text>
          <Text style={styles.value}>{movie.tags ? movie.tags.join(', ') : 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Thời lượng</Text>
          <Text style={styles.value}>{movie.duration}</Text>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Rạp chiếu</Text>
          <Text style={[styles.value, styles.bold]}>{movie.theater}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ngày chiếu</Text>
          <Text style={styles.value}>{movie.showDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Giờ chiếu</Text>
          <Text style={styles.value}>{movie.showtime}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phòng chiếu</Text>
          <Text style={styles.value}>{movie.room}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ghế ngồi</Text>
          <Text style={[styles.value, styles.seatsValue]}>
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}
          </Text>
        </View>
        <View style={[styles.row, { marginTop: 16 }]}>
          <Text style={styles.totalLabel}>TỔNG TIỀN</Text>
          <Text style={styles.totalValue}>{totalPrice.toLocaleString()}đ</Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Button
          style={styles.confirmBtn}
          onPress={onConfirm}
          disabled={selectedSeats.length === 0 || isLoading}
          loading={isLoading}
        >
          TIẾP TỤC
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.cardHeavy,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.bgHighlight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  details: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  formatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  formatText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textTertiary,
  },
  value: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  bold: {
    fontFamily: 'Inter_800ExtraBold',
    color: Colors.textPrimary,
  },
  seatsValue: {
    color: Colors.brandRed,
    fontFamily: 'Inter_800ExtraBold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  totalLabel: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    color: Colors.brandRed,
  },
  confirmBtn: {
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.errorRed,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default BookingSummary;
