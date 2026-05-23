import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import DateSelector from '../../components/schedule/DateSelector';
import MovieItem from '../../components/schedule/MovieItem';
import NoteSection from '../../components/schedule/NoteSection';
import { Colors } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';

export default function SchedulePage() {
  const [days, setDays] = useState([]);
  const [activeDate, setActiveDate] = useState('');
  const [moviesData, setMoviesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Khởi tạo 14 ngày tới
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

  // Fetch lịch chiếu theo ngày
  useEffect(() => {
    if (!activeDate) return;
    
    setLoading(true);
    fetch(`${API_BASE_URL}/api/showtimes/date/${activeDate}`)
      .then((res) => {
        if (!res.ok) throw new Error('API fetch error');
        return res.json();
      })
      .then((data) => setMoviesData(data))
      .catch((err) => {
        console.warn('Lỗi lấy dữ liệu lịch chiếu:', err);
        setMoviesData([]);
      })
      .finally(() => setLoading(false));
  }, [activeDate]);

  const handleDateChange = useCallback((dateId) => {
    setActiveDate(dateId);
  }, []);

  const ListHeader = useCallback(() => (
    <View style={styles.header}>
      <DateSelector
        days={days}
        activeTab={activeDate}
        onTabChange={handleDateChange}
      />
      <NoteSection />
    </View>
  ), [days, activeDate, handleDateChange]);

  const renderItem = useCallback(({ item }) => <MovieItem movie={item} />, []);
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch chiếu...</Text>
        </View>
      ) : (
        <FlatList
          data={moviesData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có suất chiếu nào trong ngày hôm nay.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgNoShowtime,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Colors.bgWhite,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
    fontSize: 14,
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
