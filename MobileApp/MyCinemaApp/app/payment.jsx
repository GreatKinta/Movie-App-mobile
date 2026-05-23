import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated as RNAnimated, Easing, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Button from '../components/common/Button';
import { Colors, Shadows } from '../constants/colors';
import { API_BASE_URL } from '../constants/config';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react-native';

const POLL_INTERVAL_MS = 5000;

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  if (!params.movieParsed) {
     return <View style={styles.container}><Text>Chưa chọn vé</Text></View>;
  }

  const movie = JSON.parse(params.movieParsed);
  const selectedSeats = params.selectedSeats.split(',');
  const totalPrice = Number(params.totalPrice);
  const orderCode = params.orderCode || `DONHANG_${Math.floor(Math.random() * 100000)}`;
  const resolvedBookingId = params.bookingId || null;

  // FIXME: Lấy biến môi trường expo. Tạm thời hardcode config từ vite (.env)
  const sepayAccount = process.env.EXPO_PUBLIC_SEPAY_BANK_ACCOUNT || '0123456789';
  const sepayBank = process.env.EXPO_PUBLIC_SEPAY_BANK_NAME || 'MBBank';

  const qrUrl = `https://qr.sepay.vn/img?acc=${sepayAccount}&bank=${sepayBank}&amount=${totalPrice}&des=${orderCode}`;

  const [pollStatus, setPollStatus] = useState('idle'); // idle | polling | paid | expired
  const intervalRef = useRef(null);
  
  // Animation cho dấu chấm ba
  const dotsAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (pollStatus === 'polling') {
      RNAnimated.loop(
        RNAnimated.timing(dotsAnim, {
          toValue: 3,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false, // Text changes dont support native driver
        })
      ).start();
    } else {
      dotsAnim.stopAnimation();
      dotsAnim.setValue(0);
    }
  }, [pollStatus, dotsAnim]);

  const startPolling = () => {
    if (intervalRef.current) return;
    setPollStatus('polling');

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payment/status/${orderCode}`);
        if (!res.ok) throw new Error('Lỗi kết nối server');
        const data = await res.json();

        if (data.paid) {
          clearInterval(intervalRef.current);
          setPollStatus('paid');
          
          setTimeout(() => {
             router.replace({
                pathname: '/ticket',
                params: {
                  movieParsed: params.movieParsed,
                  selectedSeats: params.selectedSeats,
                  totalPrice: params.totalPrice,
                  orderCode: orderCode,
                  bookingId: resolvedBookingId,
                  paidAt: new Date().toISOString()
                }
             });
          }, 1500);
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          clearInterval(intervalRef.current);
          setPollStatus('expired');
        }
      } catch (err) {
        // Silent error, continue polling
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const getDots = (val) => {
    if (val < 1) return '';
    if (val < 2) return '.';
    if (val < 3) return '..';
    return '...';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>THANH TOÁN ĐƠN HÀNG</Text>
        <Text style={styles.subtitle}>
          Quét mã QR bằng ứng dụng ngân hàng rồi bấm "Tôi đã thanh toán" để hệ thống tự động kiểm tra.
        </Text>
      </View>

      <View style={styles.qrSection}>
        <View style={styles.qrFrame}>
          <Image
             source={{ uri: qrUrl }}
             style={[styles.qrImage, pollStatus === 'expired' && { opacity: 0.3 }]}
             contentFit="contain"
          />
          {pollStatus === 'expired' && (
             <View style={styles.expiredOverlay}>
                <Clock color={Colors.brandRed} size={32} />
                <Text style={styles.expiredLabel}>HẾT HẠN</Text>
             </View>
          )}
        </View>
        <Text style={styles.qrHint}>Nội dung chuyển khoản</Text>
        <Text style={styles.qrCodeText}>{orderCode}</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Thông tin vé</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Phim:</Text>
          <Text style={styles.valueTitle}>{movie.title}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Rạp:</Text>
          <Text style={styles.value}>{movie.theater}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Suất chiếu:</Text>
          <Text style={styles.value}>{movie.showtime} - {movie.showDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ghế:</Text>
          <Text style={styles.seatsValue}>{selectedSeats.join(', ')}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.rowTotal}>
          <Text style={styles.labelTotal}>Tổng tiền:</Text>
          <Text style={styles.valueTotal}>{totalPrice.toLocaleString()}đ</Text>
        </View>

        <View style={styles.actions}>
           <Button
             style={[
                styles.confirmBtn,
                pollStatus === 'expired' && { backgroundColor: Colors.brandRed }
             ]}
             loading={pollStatus === 'polling'}
             disabled={pollStatus === 'polling' || pollStatus === 'paid' || pollStatus === 'expired'}
             onPress={startPolling}
           >
             {pollStatus === 'polling' ? 'Đang xác nhận' : 
              pollStatus === 'paid' ? '✅ Đã thanh toán' : 
              pollStatus === 'expired' ? 'Hết thời gian giao dịch' : 'TÔI ĐÃ THANH TOÁN'}
           </Button>

           {pollStatus === 'expired' && (
             <Button
               variant="outline"
               style={styles.backBtn}
               onPress={() => router.replace('/')}
             >
               Quay lại trang chủ đặt vé
             </Button>
           )}
        </View>

        {pollStatus === 'polling' && (
           <View style={styles.pollingInfo}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.pollingText}>Hệ thống đang kiểm tra tự động mỗi 5 giây. Xin hãy chờ...</Text>
           </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgGray,
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_900Black',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  qrSection: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.card,
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  expiredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expiredLabel: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    color: Colors.brandRed,
    marginTop: 8,
  },
  qrHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  qrCodeText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
    color: Colors.primary,
    marginTop: 4,
    letterSpacing: 2,
  },
  detailsCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 24,
    ...Shadows.cardHeavy,
  },
  sectionTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    width: 90,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textTertiary,
  },
  value: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  valueTitle: {
    flex: 1,
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  seatsValue: {
    flex: 1,
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: Colors.brandRed,
    textAlign: 'right',
  },
  divider: {
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: 16,
    borderStyle: 'dashed',
  },
  rowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  labelTotal: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  valueTotal: {
    fontFamily: 'Inter_900Black',
    fontSize: 28,
    color: Colors.brandRed,
  },
  actions: {
    gap: 12,
  },
  confirmBtn: {
    backgroundColor: Colors.success,
  },
  backBtn: {
    borderColor: Colors.brandRed,
  },
  pollingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.bgHighlight,
    borderRadius: 8,
  },
  pollingText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
