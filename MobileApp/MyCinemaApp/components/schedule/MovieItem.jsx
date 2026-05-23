import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import ShowtimeGrid from '../common/ShowtimeGrid';
import { Colors, Shadows } from '../../constants/colors';

const MovieItem = ({ movie }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: movie.poster }}
          style={styles.poster}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{movie.title}</Text>
          <Text style={styles.type}>{movie.type || '2D PHỤ ĐỀ'}</Text>
          <Text style={styles.meta}>{movie.duration} phút • {movie.genre}</Text>
        </View>
      </View>
      <ShowtimeGrid showtimes={movie.showtimes} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  type: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  meta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});

export default MovieItem;
