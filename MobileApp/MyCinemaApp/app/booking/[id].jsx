import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import SeatMap from '../../components/booking/SeatMap';
import BookingSummary from '../../components/booking/BookingSummary';
import { Colors } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';
import { ChevronLeft } from 'lucide-react-native';
import Button from '../../components/common/Button';

export default function BookingPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, getToken } = useAuth();
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seats, setSeats] = useState([]);
  const [movie, setMovie] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const fetchSeats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/showtimes/${id}/seats`);
      if (response.ok) {
        const data = await response.json();
        const mappedSeats = data.map((seat) => ({
          id: seat.rowName + seat.seatNumber,
          row: seat.rowName,
          number: seat.seatNumber.toString().padStart(2, '0'),
          status:
            seat.status === 'AVAILABLE'
              ? 'available'
              : seat.status === 'LOCKED'
              ? 'holding'
              : 'booked',
          price: Number(seat.price),
          type: seat.seatTypeName.toLowerCase(),
        }));
        setSeats(mappedSeats);
      }
    } catch (error) {
       console.warn('Lỗi lấy danh sách ghế:', error);
    }
  }, [id]);

  useEffect(() => {
    const fetchShowtimeDetail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/showtimes/${id}`);
        if (!res.ok) throw new Error('Không thể tải thông tin suất chiếu');
        const data = await res.json();

        const dt = new Date(data.startTime);
        const showtime = dt.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const showDate = dt.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        setMovie({
          id: data.movieId,
          title: data.movieTitle,
          poster: data.poster,
          showtime,
          showDate,
          room: data.roomName,
          duration: `${data.duration} phút`,
          tags: data.genre ? data.genre.split(',').map((g) => g.trim()) : [],
          ageRating: data.ageRating,
          theater: 'Rạp VIP Cinema', // FIXME thay bang API data nếu có
        });
      } catch (err) {
        console.warn(err);
      }
    };

    setLoading(true);
    fetchShowtimeDetail();
    fetchSeats().finally(() => setLoading(false));
  }, [id, fetchSeats]);

  const handleSeatSelect = (seatsToToggle) => {
    if (!seatsToToggle || seatsToToggle.length === 0) return;
    
    // Kiểm tra nếu ghế đầu tiên đã được chọn, ta thực hiện HỦY chọn cả nhóm
    setSelectedSeats((prev) => {
      const isAlreadySelected = prev.includes(seatsToToggle[0].id);
      if (isAlreadySelected) {
        const idsToRemove = seatsToToggle.map(s => s.id);
        return prev.filter((id) => !idsToRemove.includes(id));
      } else {
        const newSelection = [...prev];
        seatsToToggle.forEach(s => {
          if (s.status !== 'booked' && s.status !== 'holding' && !newSelection.includes(s.id)) {
            newSelection.push(s.id);
          }
        });
        return newSelection;
      }
    });
  };

  const calculateTotal = () => {
    let total = 0;
    const selectedCoupleSeats = [];
    
    selectedSeats.forEach(seatId => {
      const seat = seats.find(s => s.id === seatId);
      if (seat) {
        if (seat.type === 'couple' || seat.type === 'đôi') {
          selectedCoupleSeats.push(seat);
        } else {
          total += seat.price;
        }
      }
    });
    
    // Gom nhóm ghế đôi theo hàng
    const coupleByRow = {};
    selectedCoupleSeats.forEach(s => {
      if (!coupleByRow[s.row]) coupleByRow[s.row] = [];
      coupleByRow[s.row].push(s);
    });
    
    Object.keys(coupleByRow).forEach(row => {
      const rowSeats = coupleByRow[row].sort((a, b) => parseInt(a.number) - parseInt(b.number));
      let i = 0;
      while (i < rowSeats.length) {
        const s1 = rowSeats[i];
        const s2 = (i + 1 < rowSeats.length) ? rowSeats[i + 1] : null;
        
        // Chỉ tính tiền của 1 ghế trong cặp ghế đôi!
        total += s1.price;
        
        if (s2) {
          i += 2;
        } else {
          i += 1;
        }
      }
    });
    
    return total;
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để đặt vé!', [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }

    if (selectedSeats.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ghế!');
      return;
    }

    setIsCreatingBooking(true);
    setBookingError(null);

    const payload = {
      userId: user.id,
      showtimeId: parseInt(id),
      seatIds: selectedSeats,
      totalAmount: calculateTotal(),
    };

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        Alert.alert('Phiên hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Ghế đã bị người khác chọn. Vui lòng chọn ghế khác!');
      }

      const data = await res.json();
      router.push({
        pathname: '/payment',
        params: {
          movieParsed: JSON.stringify(movie),
          selectedSeats: selectedSeats.join(','),
          totalPrice: calculateTotal(),
          bookingInfo: JSON.stringify(data),
          bookingId: data?.bookingId,
          orderCode: data?.orderCode,
        },
      });
    } catch (err) {
      setBookingError(err.message);
      setSelectedSeats([]);
      fetchSeats(); // Refresh seats mapping
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (loading || !movie) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" style={styles.backBtn} onPress={() => router.back()}>
           <ChevronLeft size={28} color={Colors.textPrimary} />
        </Button>
        <Text style={styles.headerTitle} numberOfLines={1}>{movie.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
         
         <View style={styles.timerBar}>
            <Text style={styles.timerLabel}>Thời gian giữ ghế còn lại</Text>
            <Text style={[styles.timerValue, timeLeft < 60 && { color: Colors.brandRed }]}>
              {formatTime(timeLeft)}
            </Text>
         </View>

         <SeatMap 
           seats={seats} 
           selectedSeats={selectedSeats} 
           onSeatSelect={handleSeatSelect} 
         />

         <View style={styles.summaryContainer}>
           <BookingSummary
             movie={movie}
             selectedSeats={selectedSeats}
             totalPrice={calculateTotal()}
             onConfirm={handleConfirmBooking}
             isLoading={isCreatingBooking}
             error={bookingError}
           />
         </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgGray,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginRight: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  timerBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgHighlight,
    paddingVertical: 12,
  },
  timerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timerValue: {
    fontFamily: 'Inter_900Black',
    fontSize: 16,
    color: Colors.primary,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
