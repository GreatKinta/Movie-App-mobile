import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Download, Home } from 'lucide-react-native';
import { useRef } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Button from '../components/common/Button';
import { Colors, Shadows } from '../constants/colors';

export default function TicketPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const ticketRef = useRef();

  const handleSaveTicket = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Chưa cấp quyền', 'App cần quyền truy cập ảnh để lưu vé.', [{ text: 'OK' }]);
        return;
      }

      const uri = await captureRef(ticketRef, {
        format: 'jpg',
        quality: 0.8,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      if (asset) {
        Alert.alert('Thành công', 'Đã lưu vé vào thư viện ảnh của bạn!');
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Lỗi', 'Không thể lưu vé lúc này.');
    }
  };

  if (!params.movieParsed) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy vé</Text>
        <Button onPress={() => router.replace('/')}>Về trang chủ</Button>
      </View>
    );
  }

  const movie = JSON.parse(params.movieParsed);
  const selectedSeats = params.selectedSeats.split(',');
  const totalPrice = Number(params.totalPrice);
  const orderCode = params.orderCode;
  const paidAt = params.paidAt;

  const getFormattedDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://payment.dvanlong1102.id.vn/ticket/${orderCode}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.successBadge}>
          <CheckCircle2 color="#fff" size={24} />
          <Text style={styles.successText}>ĐẶT VÉ THÀNH CÔNG!</Text>
        </View>
      </View>

      {/* Ticket Wrapper */}
      <View style={styles.ticket} ref={ticketRef} collapsable={false}>
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <Image
            source={{ uri: movie.poster }}
            style={styles.poster}
            contentFit="cover"
          />
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
            <View style={styles.tagList}>
              {movie.tags?.map(t => (
                <Text key={t} style={styles.tag}>{t}</Text>
              ))}
              <Text style={[styles.tag, styles.tagType]}>{movie.type || '2D'}</Text>
            </View>
          </View>
        </View>

        {/* Divider 1 */}
        <View style={styles.divider}>
          <View style={[styles.notch, styles.notchLeft]} />
          <View style={[styles.notch, styles.notchRight]} />
          <View style={styles.dashedLine} />
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>📍 Rạp chiếu</Text>
            <Text style={styles.value}>{movie.theater}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>🎭 Phòng</Text>
            <Text style={styles.value}>{movie.room}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>🕐 Suất chiếu</Text>
            <Text style={styles.value}>{movie.showtime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>📅 Ngày chiếu</Text>
            <Text style={styles.value}>{movie.showDate}</Text>
          </View>
          <View style={styles.detailItemFull}>
            <Text style={styles.label}>💺 Ghế ngồi</Text>
            <Text style={styles.seatsValue}>{selectedSeats.join(', ')}</Text>
          </View>
        </View>

        {/* Divider 2 */}
        <View style={styles.divider}>
          <View style={[styles.notch, styles.notchLeft]} />
          <View style={[styles.notch, styles.notchRight]} />
          <View style={styles.dashedLine} />
        </View>

        {/* Footer info & QR Code */}
        <View style={styles.footer}>
          <View style={styles.orderInfo}>
            <Text style={styles.label}>Mã đơn hàng</Text>
            <Text style={styles.orderCode}>{orderCode}</Text>
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.label}>Tổng tiền</Text>
            <Text style={styles.total}>{totalPrice.toLocaleString()}đ</Text>
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.label}>Thanh toán lúc</Text>
            <Text style={styles.paidAt}>{getFormattedDate(paidAt)}</Text>
          </View>

          <View style={styles.qrContainer}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrCode}
              contentFit="contain"
            />
            <Text style={styles.qrHint}>Xuất trình mã này tại quầy soát vé</Text>
          </View>
        </View>

      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          style={styles.actionBtn}
          onPress={handleSaveTicket}
        >
          <Download color={Colors.primary} size={20} style={{ marginRight: 8 }} />
          LƯU VÉ
        </Button>

        <Button
          variant="primary"
          style={styles.actionBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Home color="#fff" size={20} style={{ marginRight: 8 }} />
          VỀ NHÀ
        </Button>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    ...Shadows.card,
  },
  successText: {
    color: '#fff',
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
  },
  ticket: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.cardHeavy,
    marginBottom: 24,
  },
  ticketHeader: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    backgroundColor: Colors.primary,
  },
  poster: {
    width: 70,
    height: 105,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  movieTitle: {
    color: '#fff',
    fontFamily: 'Inter_900Black',
    fontSize: 20,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden', // iOS border radius text bug
  },
  tagType: {
    backgroundColor: Colors.brandRed,
    borderColor: Colors.brandRedLight,
    borderWidth: 1,
  },
  divider: {
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: Colors.bgWhite,
  },
  dashedLine: {
    height: 1,
    backgroundColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 1,
    marginHorizontal: 20,
  },
  notch: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: Colors.bgGray,
    borderRadius: 12,
    top: 0,
    zIndex: 10,
  },
  notchLeft: {
    left: -12,
  },
  notchRight: {
    right: -12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 24,
    gap: 16,
  },
  detailItem: {
    width: '45%',
    marginBottom: 8,
  },
  detailItemFull: {
    width: '100%',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  seatsValue: {
    fontFamily: 'Inter_900Black',
    fontSize: 18,
    color: Colors.brandRed,
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.bgHighlight,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderCode: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: Colors.primary,
  },
  total: {
    fontFamily: 'Inter_900Black',
    fontSize: 20,
    color: Colors.brandRed,
  },
  paidAt: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  qrCode: {
    width: 150,
    height: 150,
    marginBottom: 12,
  },
  qrHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  homeBtn: {
    flexDirection: 'row',
    marginHorizontal: 16,
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
