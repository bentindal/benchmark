import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { BenchItem } from '../lib/api';
import RatingStars from './RatingStars';

import { resolvePhotoUrl, resolvePhotoUrls } from '../lib/images';

type Props = {
  bench: BenchItem;
};

export default function BenchCard({ bench }: Props) {
  const photos = resolvePhotoUrls(bench.photos_urls);
  const photo = photos[0];
  const overall = bench.average_rating?.overall;

  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e8e4dc',
        shadowColor: '#1b4332',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={() => router.push(`/bench/${bench.id}`)}
      activeOpacity={0.85}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: '100%', aspectRatio: 4 / 3 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 4 / 3,
            backgroundColor: '#e8e4dc',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 48 }}>🪑</Text>
        </View>
      )}

      <View style={{ padding: 12 }}>
        <Text
          className="font-inter-semibold text-bench-moss text-base"
          numberOfLines={1}
        >
          {bench.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
          <RatingStars rating={overall ?? 0} size={13} />
          <Text className="font-inter text-bench-bark text-xs">
            {overall ? overall.toFixed(1) : '—'} · {bench.ratings_count}{' '}
            {bench.ratings_count === 1 ? 'rating' : 'ratings'}
          </Text>
        </View>

        {bench.average_rating && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {(['view', 'comfort', 'location'] as const).map((dim) => {
              const val = bench.average_rating![dim];
              if (!val) return null;
              return (
                <View
                  key={dim}
                  style={{
                    backgroundColor: '#f0faf4',
                    borderRadius: 99,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: '#74c69d',
                  }}
                >
                  <Text className="font-inter text-bench-green" style={{ fontSize: 11 }}>
                    {dim[0].toUpperCase() + dim.slice(1)} {val.toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
          {bench.user.avatar_url ? (
            <Image
              source={{ uri: resolvePhotoUrl(bench.user.avatar_url) }}
              style={{ width: 18, height: 18, borderRadius: 9 }}
            />
          ) : (
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#e8e4dc',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10 }}>👤</Text>
            </View>
          )}
          <Text className="font-inter text-bench-bark text-xs" numberOfLines={1}>
            {bench.user.username}
          </Text>
          {bench.location_name ? (
            <>
              <Text className="font-inter text-bench-stone text-xs">·</Text>
              <Text className="font-inter text-bench-bark text-xs" numberOfLines={1} style={{ flex: 1 }}>
                {bench.location_name}
              </Text>
            </>
          ) : null}
        </View>

        {bench.distance_km != null && (
          <Text className="font-inter text-bench-green text-xs mt-1">
            {bench.distance_km < 1
              ? `${Math.round(bench.distance_km * 1000)} m away`
              : `${bench.distance_km.toFixed(1)} km away`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
