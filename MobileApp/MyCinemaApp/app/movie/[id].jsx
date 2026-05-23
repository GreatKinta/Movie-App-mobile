import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import DateSelector from '../../components/schedule/DateSelector';
import ShowtimeGrid from '../../components/common/ShowtimeGrid';
import { Colors } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';
import { ChevronLeft, Share2, PlayCircle } from 'lucide-react-native';

export default function MovieDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [movie, setMovie] = useState(null);
  const [days, setDays] = useState([]);
  const [activeDate, setActiveDate] = useState('');
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate 14 days
  useEffect(() => {
    const generateDays = () => {
      const today = new Date();
      const next14Days = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        
        const dayNumber = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        
        next14Days.push({
          id: `${d.getFullYear()}-${month}-${dayNumber}`,
          dayNumber: dayNumber,
          monthYear: `${month}/${d.getFullYear().toString().slice(-2)}`,
        });
      }
      return next14Days;
    };

    const generated = generateDays();
    setDays(generated);
    setActiveDate(generated[0].id);
  }, []);

  // Fetch movie details & initial showtimes
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/movies/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Movie not found');
        return res.json();
      })
      .then((data) => {
        setMovie(data);
        if (activeDate) {
          fetchShowtimes(data.id, activeDate);
        }
      })
      .catch((err) => {
        console.warn('Lỗi lấy dữ liệu phim:', err);
      })
      .finally(() => setLoading(false));
  }, [id, activeDate]);

  // Fetch showtimes separated
  const fetchShowtimes = (movieId, date) => {
    fetch(`${API_BASE_URL}/api/showtimes/movie/${movieId}?date=${date}`)
      .then((res) => {
        if (!res.ok) throw new Error('No showtimes');
        return res.json();
      })
      .then((data) => setShowtimes(data))
      .catch(() => setShowtimes([]));
  };

  const handleDateChange = useCallback((dateId) => {
    setActiveDate(dateId);
    if (movie) {
      fetchShowtimes(movie.id, dateId);
    }
  }, [movie]);

  if (loading || !movie) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const tags = movie.genre?.split(',').map(tag => tag.trim());

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: movie.banner || movie.poster }}
            style={styles.banner}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <ChevronLeft color="#fff" size={28} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Share2 color="#fff" size={24} />
            </Pressable>
          </View>
          {/* Play Icon Placeholder */}
          <View style={styles.playIconContainer}>
             <PlayCircle color="rgba(255,255,255,0.8)" size={64} />
          </View>
          {/* Movie Tags & Age */}
          <View style={styles.bannerInfo}>
            <View style={styles.ageTag}>
              <Text style={styles.ageText}>{movie.ageRating || 'T13'}</Text>
            </View>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{movie.type || '2D PHỤ ĐỀ'}</Text>
            </View>
          </View>
        </View>

        {/* Movie Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.movieName}>{movie.title}</Text>
          
          <View style={styles.tagList}>
            {(tags || []).map((t, idx) => (
              <View key={idx} style={styles.genreTag}>
                <Text style={styles.genreText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.subInfo}>
            <Text style={styles.metaText}>
              <Text style={{ fontFamily: 'Inter_700Bold' }}>Đạo diễn:</Text> {movie.director || 'Đang cập nhật'}
            </Text>
            <Text style={styles.metaText}>
            <Text style={{ fontFamily: 'Inter_700Bold' }}>Thời lượng:</Text> {movie.duration} phút
            </Text>
            <Text style={styles.metaText}>
            <Text style={{ fontFamily: 'Inter_700Bold' }}>Khởi chiếu:</Text> {movie.releaseDate || 'Đang cập nhật'}
            </Text>
          </View>

          <Text style={styles.descriptionLabel}>Nội dung phim</Text>
          <Text style={styles.descriptionText}>
            {movie.description || 'Chưa có thông tin mô tả chi tiết cho phim này.'}
          </Text>

          {/* Showtimes Section */}
          <View style={styles.showtimesSection}>
            <Text style={styles.sectionTitle}>Lịch chiếu</Text>
            <DateSelector
              days={days}
              activeTab={activeDate}
              onTabChange={handleDateChange}
            />
            {showtimes && showtimes.length > 0 ? (
               <View style={styles.theaterContainer}>
                 <Text style={styles.theaterName}>Rạp 1</Text>
                 <ShowtimeGrid showtimes={showtimes} />
               </View>
            ) : (
                <Text style={styles.emptyShowtimes}>
                   Không có suất chiếu nào cho ngày này.
                </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#111',
  },
  banner: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  ageTag: {
    backgroundColor: Colors.brandRed,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  ageText: {
    color: '#fff',
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 13,
  },
  typeTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  typeText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  detailsContainer: {
    padding: 20,
  },
  movieName: {
    fontSize: 24,
    fontFamily: 'Inter_900Black',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  genreTag: {
    backgroundColor: Colors.bgTag,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  genreText: {
    color: Colors.textTertiary,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  subInfo: {
    gap: 8,
    marginBottom: 24,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  descriptionLabel: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  showtimesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  theaterContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.bgLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  theaterName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  emptyShowtimes: {
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    fontSize: 15,
    marginTop: 16,
    fontStyle: 'italic',
  },
});
