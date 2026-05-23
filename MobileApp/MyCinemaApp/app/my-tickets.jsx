import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeft, Ticket } from 'lucide-react-native';
import api from '../services/api';
import { Colors, Shadows } from '../constants/colors';

export default function MyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTickets = async (pageNumber = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNumber === 1) setLoading(true);

      const res = await api.get(`/bookings/my-tickets?page=${pageNumber}&pageSize=10`);
      
      const { items, totalPages } = res.data;
      
      if (isRefresh || pageNumber === 1) {
        setTickets(items);
      } else {
        setTickets(prev => [...prev, ...items]);
      }
      
      setHasMore(pageNumber < totalPages);
      setPage(pageNumber);
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRefresh = () => {
    fetchTickets(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchTickets(page + 1);
    }
  };

  const handleTicketPress = (ticket) => {
    // If ticket is already paid, we can just show the QR code ticket view
    // Note: the original ticket view used params like `movieParsed`, `selectedSeats`, `totalPrice` etc.
    // For simplicity, we can pass them to the ticket view if required, or simply show a simplified modal.
    // Let's reuse the ticket route
    
    // We recreate the state object needed for ticket.jsx
    const movieObj = {
      title: ticket.movieTitle,
      poster: ticket.moviePoster,
      genres: ticket.displayTags?.split(', '),
      type: ticket.displayTags?.split(', ')[0] || "2D",
      theater: "MyCinema Center",
      room: ticket.roomName,
      showtime: new Date(ticket.showtimeStart).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}),
      showDate: new Date(ticket.showtimeStart).toLocaleDateString('vi-VN')
    };

    router.push({
      pathname: '/ticket',
      params: {
        movieParsed: JSON.stringify(movieObj),
        selectedSeats: ticket.seats.join(','),
        totalPrice: ticket.totalAmount,
        orderCode: ticket.orderCode,
        paidAt: ticket.createdAt // We don't have paidAt directly, so createdAt acts as the fallback
      }
    });
  };

  const renderTicket = ({ item }) => {
    const d = new Date(item.showtimeStart);
    const dateStr = d.toLocaleDateString('vi-VN');
    const timeStr = d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => handleTicketPress(item)}
      >
        <Image 
          source={{ uri: item.moviePoster }} 
          style={styles.poster}
          contentFit="cover"
        />
        <View style={styles.cardInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>{item.movieTitle}</Text>
          <Text style={styles.detailText}>🕐 {timeStr} - {dateStr}</Text>
          <Text style={styles.detailText}>🎭 {item.roomName}</Text>
          <Text style={styles.detailText}>💺 {item.seats.join(', ')}</Text>
          
          <View style={styles.footerRow}>
            <Text style={styles.price}>{Number(item.totalAmount).toLocaleString()}đ</Text>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Đã thanh toán</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    !loading && (
      <View style={styles.emptyContainer}>
        <Ticket size={80} color={Colors.border} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
        <Text style={styles.emptySubtitle}>Bạn chưa đặt vé nào hoặc vé đã hết hạn.</Text>
      </View>
    )
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color={Colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vé Đã Đặt</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* List */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.orderId.toString()}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          (loading && !refreshing) ? <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgGray,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgWhite,
    ...Shadows.card,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Shadows.card,
  },
  poster: {
    width: 100,
    height: 150,
  },
  cardInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  movieTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  detailText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: Colors.brandRed,
  },
  statusBadge: {
    backgroundColor: Colors.success + '20', // transparent green
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.success,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textTertiary,
    textAlign: 'center',
  }
});
