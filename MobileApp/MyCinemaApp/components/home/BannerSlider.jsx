import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const BANNER_HEIGHT = 150;

const BannerSlider = ({ movies }) => {
  const router = useRouter();
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const showingMovies = movies.filter((m) => m.status === 'showing' && m.banner);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (showingMovies.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % showingMovies.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [showingMovies.length]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => router.push(`/movie/${item.id}`)}
        style={styles.bannerItem}
      >
        <Image
          source={{ uri: item.banner || item.poster }}
          style={styles.bannerImage}
          contentFit="cover"
          transition={300}
        />
      </Pressable>
    ),
    [router]
  );

  if (showingMovies.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={showingMovies}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      {/* Dots indicator */}
      <View style={styles.dots}>
        {showingMovies.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  bannerItem: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
  },
  bannerImage: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 18,
  },
});

export default BannerSlider;
