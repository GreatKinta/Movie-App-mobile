import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Màu sắc chuẩn theo hình ảnh của USER
const SEAT_COLORS = {
  available: { bg: '#D1D7DD', border: '#A0AAB5', text: '#111827' },
  selected: { bg: '#0A4E9B', border: '#0A4E9B', text: '#FFFFFF' },
  holding: { bg: '#35B0EC', border: '#35B0EC', text: '#FFFFFF' },
  booked: { bg: '#F32C0D', border: '#F32C0D', text: '#FFFFFF' },
  reserved: { bg: '#FFC814', border: '#FFC814', text: '#111827' }
};

const SeatMap = ({ seats, selectedSeats, onSeatSelect }) => {
  // Gom nhóm ghế theo hàng
  const rows = [...new Set(seats.map((seat) => seat.row))].sort();

  // Tìm giá động của từng loại ghế từ dữ liệu database (không cứng nhắc)
  const normalSeat = seats.find(s => s.type === 'normal' || s.type === 'thường');
  const vipSeat = seats.find(s => s.type === 'vip');
  const coupleSeat = seats.find(s => s.type === 'couple' || s.type === 'đôi');

  const normalPrice = normalSeat ? `${normalSeat.price.toLocaleString('vi-VN')} đ` : '50.000 đ';
  const vipPrice = vipSeat ? `${vipSeat.price.toLocaleString('vi-VN')} đ` : '50.000 đ';
  const couplePrice = coupleSeat ? `${coupleSeat.price.toLocaleString('vi-VN')} đ` : '100.000 đ';

  // Hàm gom nhóm ghế đôi và ghế đơn trong một hàng
  const groupSeatsInRow = (rowSeats) => {
    // Sắp xếp ghế theo số ghế giảm dần giống như rạp thực tế (ví dụ: K18 -> K01)
    const sorted = [...rowSeats].sort((a, b) => parseInt(b.number) - parseInt(a.number));
    const grouped = [];
    let i = 0;

    while (i < sorted.length) {
      const seat = sorted[i];
      if (seat.type === 'couple' || seat.type === 'đôi') {
        const nextSeat = sorted[i + 1];
        // Ghế đôi kế tiếp cùng hàng
        if (nextSeat && (nextSeat.type === 'couple' || nextSeat.type === 'đôi')) {
          grouped.push({
            isDouble: true,
            seat1: seat,
            seat2: nextSeat,
            id: `${seat.id}_${nextSeat.id}`
          });
          i += 2;
        } else {
          grouped.push({
            isDouble: true,
            seat1: seat,
            seat2: null,
            id: seat.id
          });
          i += 1;
        }
      } else {
        grouped.push({
          isDouble: false,
          seat: seat,
          id: seat.id
        });
        i += 1;
      }
    }
    return grouped;
  };

  return (
    <View style={styles.container}>
      {/* ─── BẢNG CHÚ THÍCH (LEGEND) 2 CỘT SANG TRỌNG ─── */}
      <View style={styles.legendContainer}>
        {/* Cột 1: Trạng thái ghế */}
        <View style={styles.legendColumn}>
          <View style={styles.legendRow}>
            <View style={[styles.seatIcon, styles.seatEmpty]} />
            <Text style={styles.legendLabel}>Ghế trống</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.seatIcon, styles.seatHolding]} />
            <Text style={styles.legendLabel}>Ghế đang được giữ</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.seatIcon, styles.seatSelected]} />
            <Text style={styles.legendLabel}>Ghế đang chọn</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.seatIcon, styles.seatBooked]} />
            <Text style={styles.legendLabel}>Ghế đã bán</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.seatIcon, styles.seatReserved]} />
            <Text style={styles.legendLabel}>Ghế đã đặt trước</Text>
          </View>
        </View>

        {/* Cột 2: Loại ghế & Giá vé lấy động từ DB */}
        <View style={[styles.legendColumn, { borderLeftWidth: 1, borderLeftColor: '#F3F4F6', paddingLeft: 16 }]}>
          <View style={styles.priceRow}>
            <View style={[styles.seatIcon, styles.seatEmpty]} />
            <View>
              <Text style={styles.priceLabel}>Ghế thường</Text>
              <Text style={styles.priceValue}>{normalPrice}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <View style={[styles.seatIcon, styles.seatVipIcon]} />
            <View>
              <Text style={styles.priceLabel}>Ghế VIP</Text>
              <Text style={styles.priceValue}>{vipPrice}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <View style={[styles.seatIconDouble, styles.seatEmptyDouble]} />
            <View>
              <Text style={styles.priceLabel}>Ghế đôi</Text>
              <Text style={styles.priceValue}>{couplePrice}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* ─── MÀN HÌNH CHIẾU CONG (ARC SCREEN) ─── */}
      <View style={styles.screenContainer}>
        <View style={styles.screenCurve} />
        <Text style={styles.screenText}>MÀN HÌNH CHIẾU</Text>
      </View>

      {/* ─── SƠ ĐỒ GHẾ ─── */}
      <ScrollView 
        horizontal 
        contentContainerStyle={styles.scrollContent} 
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {rows.map((row) => {
            const rowSeats = seats.filter((seat) => seat.row === row);
            const groupedSeats = groupSeatsInRow(rowSeats);

            return (
              <View key={row} style={styles.row}>
                {/* Nhãn hàng bên trái */}
                <Text style={styles.rowLabel}>{row}</Text>

                <View style={styles.seatsRow}>
                  {groupedSeats.map((item) => {
                    if (item.isDouble) {
                      const { seat1, seat2 } = item;
                      
                      // Kiểm tra trạng thái của ghế đôi
                      const isSelected = selectedSeats.includes(seat1.id) || (seat2 && selectedSeats.includes(seat2.id));
                      const isBooked = seat1.status === 'booked' || (seat2 && seat2.status === 'booked');
                      const isHolding = seat1.status === 'holding' || (seat2 && seat2.status === 'holding');

                      let statusKey = 'available';
                      if (isSelected) statusKey = 'selected';
                      else if (isBooked) statusKey = 'booked';
                      else if (isHolding) statusKey = 'holding';

                      const config = SEAT_COLORS[statusKey];

                      // Định dạng nhãn số ghế, ví dụ: K18 K17
                      const num1 = parseInt(seat1.number);
                      const num2 = seat2 ? parseInt(seat2.number) : null;
                      const label = num2 !== null ? `${seat1.row}${num2} ${seat1.row}${num1}` : `${seat1.row}${num1}`;

                      return (
                        <Pressable
                          key={item.id}
                          style={[
                            styles.doubleSeat,
                            { backgroundColor: config.bg, borderColor: config.border }
                          ]}
                          onPress={() => {
                            const list = seat2 ? [seat1, seat2] : [seat1];
                            onSeatSelect(list);
                          }}
                          disabled={isBooked || isHolding}
                        >
                          <Text style={[styles.seatText, { color: config.text, fontSize: 10, fontWeight: '700' }]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    } else {
                      const { seat } = item;
                      const isSelected = selectedSeats.includes(seat.id);
                      const isBooked = seat.status === 'booked';
                      const isHolding = seat.status === 'holding';

                      let statusKey = 'available';
                      if (isSelected) statusKey = 'selected';
                      else if (isBooked) statusKey = 'booked';
                      else if (isHolding) statusKey = 'holding';

                      const config = SEAT_COLORS[statusKey];
                      const displayNum = parseInt(seat.number).toString();

                      return (
                        <Pressable
                          key={seat.id}
                          style={[
                            styles.seat,
                            { backgroundColor: config.bg, borderColor: config.border }
                          ]}
                          onPress={() => onSeatSelect([seat])}
                          disabled={isBooked || isHolding}
                        >
                          <Text style={[styles.seatText, { color: config.text }]}>
                            {seat.row}{displayNum}
                          </Text>
                        </Pressable>
                      );
                    }
                  })}
                </View>

                {/* Nhãn hàng bên phải */}
                <Text style={styles.rowLabel}>{row}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  // Chú thích
  legendContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  legendColumn: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: '#4B5563',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  priceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#111827',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  // Màn hình chiếu cong tinh xảo
  screenContainer: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  screenCurve: {
    width: '85%',
    height: 14,
    borderTopWidth: 3.5,
    borderColor: '#9EADC0',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    transform: [{ scaleY: 0.45 }],
  },
  screenText: {
    color: '#7E8E9F',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 2,
  },
  // Grid ghế
  scrollContent: {
    paddingHorizontal: 24,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    width: 24,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#9CA3AF',
  },
  seatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 12,
  },
  // Ghế đơn
  seat: {
    width: 32,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Ghế đôi lộng lẫy
  doubleSeat: {
    width: 70,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  // Icon ghế chú thích
  seatIcon: {
    width: 20,
    height: 15,
    borderRadius: 4,
    borderWidth: 1,
  },
  seatIconDouble: {
    width: 36,
    height: 15,
    borderRadius: 4,
    borderWidth: 1,
  },
  seatEmpty: {
    backgroundColor: '#D1D7DD',
    borderColor: '#A0AAB5',
  },
  seatEmptyDouble: {
    backgroundColor: '#D1D7DD',
    borderColor: '#A0AAB5',
  },
  seatHolding: {
    backgroundColor: '#35B0EC',
    borderColor: '#35B0EC',
  },
  seatSelected: {
    backgroundColor: '#0A4E9B',
    borderColor: '#0A4E9B',
  },
  seatBooked: {
    backgroundColor: '#F32C0D',
    borderColor: '#F32C0D',
  },
  seatReserved: {
    backgroundColor: '#FFC814',
    borderColor: '#FFC814',
  },
  seatVipIcon: {
    backgroundColor: '#D1D7DD',
    borderColor: '#A0AAB5',
  }
});

export default SeatMap;
