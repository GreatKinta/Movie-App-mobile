import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import MovieCard from '../../components/common/MovieCard';
import BannerSlider from '../../components/home/BannerSlider';
import { Colors, Shadows } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';
import { User, Star, Ticket } from 'lucide-react-native';

export default function HomePage() {
  const [moviesData, setMoviesData] = useState([]);
  const [activeTab, setActiveTab] = useState('showing');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/movies`)
      .then((res) => res.json())
      .then((data) => setMoviesData(data))
      .catch((err) => console.warn('Lỗi khi tải phim:', err))
      .finally(() => setLoading(false));
  }, []);

  const displayedMovies = moviesData.filter((movie) => movie.status?.toLowerCase() === activeTab);

  const renderItem = useCallback(({ item }) => <MovieCard movie={item} />, []);
  const keyExtractor = useCallback((item) => item.id?.toString() || item.movieId?.toString(), []);

  const tabs = [
    { key: 'coming', label: 'SẮP CHIẾU' },
    { key: 'showing', label: 'ĐANG CHIẾU' },
  ];

  const ListHeader = useCallback(
    () => (
      <>
        {/* User Greeting Header */}
        <View style={styles.greetingContainer}>
          <View style={styles.greetingLeft}>
            <View style={styles.greetingAvatar}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: `${API_BASE_URL}${user.avatarUrl}` }}
                  style={styles.greetingAvatarImage}
                />
              ) : (
                <User size={20} color="#fff" />
              )}
            </View>
            <View>
              <Text style={styles.greetingText}>
                Chào <Text style={styles.greetingName}>{user?.fullName || user?.username || 'Bạn'}</Text>
              </Text>
              <View style={styles.memberRow}>
                <User size={12} color={Colors.textTertiary} />
                <Text style={styles.memberText}>MEMBER</Text>
                <View style={styles.statItem}>
                  <Star size={12} color={Colors.gold} />
                  <Text style={styles.statText}>0</Text>
                </View>
                <View style={styles.statItem}>
                  <Ticket size={12} color={Colors.primary} />
                  <Text style={styles.statText}>0</Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.brandText}>MY{'\n'}CINEMA</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNav}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Banner Slider */}
        <BannerSlider movies={moviesData} />
      </>
    ),
    [moviesData, activeTab, user]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải phim...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={displayedMovies}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={3}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có phim nào.</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgWhite,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
    fontSize: 14,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: Colors.bgWhite,
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  greetingAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greetingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  greetingName: {
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  memberText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textTertiary,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  statText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  brandText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'right',
    lineHeight: 18,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: Colors.bgWhite,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  row: {
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    gap: 8,
  },
  listContent: {
    paddingBottom: 24,
    backgroundColor: Colors.bgWhite,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
    fontSize: 15,
  },
});
