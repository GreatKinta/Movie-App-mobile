import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 8;
const HORIZONTAL_PADDING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * 2) / 3;
const POSTER_HEIGHT = CARD_WIDTH * 1.45;

const AGE_RATING_COLORS = {
  P: '#4CAF50',
  T13: '#FF9800',
  T16: '#FF5722',
  T18: '#F44336',
  C13: '#FF9800',
  C16: '#FF5722',
  C18: '#F44336',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MovieCard = React.memo(({ movie }) => {
  const router = useRouter();
  const pressed = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    router.push(`/movie/${movie.id}`);
  }, [movie.id, router]);

  const handlePressIn = useCallback(() => {
    Animated.timing(pressed, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    Animated.timing(pressed, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [pressed]);

  const animatedCardStyle = {
    transform: [{ scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }],
  };

  const ageColor = AGE_RATING_COLORS[movie.ageRating] || AGE_RATING_COLORS.P;
  const isHot = movie.rating >= 7.5;

  return (
    <AnimatedPressable
      style={[styles.card, animatedCardStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={`Phim ${movie.title}`}
      accessibilityRole="button"
    >
      <View style={styles.posterContainer}>
        <Image
          source={{ uri: movie.poster }}
          style={styles.poster}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={300}
        />

        {/* Age Rating Badge */}
        <View style={[styles.ageRatingBadge, { backgroundColor: ageColor }]}>
          <Text style={styles.ageRatingText}>{movie.ageRating}</Text>
        </View>

        {/* HOT Badge */}
        {isHot && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotText}>HOT</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.movieName} numberOfLines={2}>
          {movie.title}
        </Text>
        <Text style={styles.duration}>{movie.duration} phút</Text>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  posterContainer: {
    width: '100%',
    height: POSTER_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  ageRatingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  ageRatingText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  hotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF1744',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 8,
    transform: [{ rotate: '0deg' }],
  },
  hotText: {
    color: '#fff',
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  info: {
    paddingTop: 8,
    gap: 2,
  },
  movieName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    lineHeight: 17,
    color: Colors.textPrimary,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
  },
});

export default MovieCard;
