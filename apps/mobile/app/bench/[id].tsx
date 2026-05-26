import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker } from 'react-native-maps';
import { benchApi, commentApi, type CommentItem, type VisitItem } from '../../lib/api';
import { resolvePhotoUrl, resolvePhotoUrls } from '../../lib/images';
import { useAuthStore } from '../../lib/auth';
import RatingStars from '../../components/RatingStars';

const { width } = Dimensions.get('window');

function ScoreChip({ label, value }: { label: string; value: number | null | undefined }) {
  if (!value) return null;
  return (
    <View
      style={{
        backgroundColor: '#f0faf4',
        borderWidth: 1,
        borderColor: '#74c69d',
        borderRadius: 99,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#7a6652' }}>{label}</Text>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#2d6a4f' }}>
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

function VisitCard({ visit }: { visit: VisitItem }) {
  const photos = resolvePhotoUrls(visit.photos_urls);
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e8e4dc',
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {visit.user?.avatar_url ? (
          <Image
            source={{ uri: resolvePhotoUrl(visit.user.avatar_url) }}
            style={{ width: 22, height: 22, borderRadius: 11 }}
          />
        ) : (
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#e8e4dc',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 11 }}>👤</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => visit.user && router.push(`/user/${visit.user.id}`)}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#2d6a4f' }}>
            {visit.user?.username ?? 'Someone'}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
          ·{' '}
          {new Date(visit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {visit.overall_score ? (
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <RatingStars rating={visit.overall_score} size={12} />
          </View>
        ) : null}
      </View>

      {photos.length > 0 && (
        <FlatList
          data={photos}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, marginBottom: visit.note ? 8 : 0 }}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={{ width: 90, height: 90, borderRadius: 8 }} />
          )}
        />
      )}

      {visit.note ? (
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#1b4332', lineHeight: 20 }}>
          {visit.note}
        </Text>
      ) : null}
    </View>
  );
}

export default function BenchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const benchId = parseInt(id, 10);
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [commentText, setCommentText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bench', benchId],
    queryFn: () => benchApi.get(benchId).then((r) => r.data),
  });

  const submitComment = useMutation({
    mutationFn: () => commentApi.create(benchId, commentText.trim()),
    onSuccess: () => {
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['bench', benchId] });
    },
    onError: () => Alert.alert('Error', 'Could not post comment.'),
  });

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f6f1', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2d6a4f" size="large" />
      </View>
    );
  }

  const { bench, visits, comments } = data;
  const gallery = resolvePhotoUrls(bench.gallery_urls);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8f6f1' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Photo gallery (aggregated across all visits) */}
        {gallery.length > 0 ? (
          <FlatList
            data={gallery}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={gallery.length > 1}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height: width * 0.75 }} resizeMode="cover" />
            )}
          />
        ) : (
          <View
            style={{
              width,
              height: width * 0.6,
              backgroundColor: '#e8e4dc',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 64 }}>🪑</Text>
          </View>
        )}

        <View style={{ padding: 16 }}>
          {/* Title */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#1b4332', marginBottom: 4 }}>
            {bench.title}
          </Text>

          {/* Location */}
          {bench.location_name && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652', marginBottom: 8 }}>
              📍 {bench.location_name}
            </Text>
          )}

          {/* Description */}
          {bench.description && (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: '#1b4332',
                lineHeight: 22,
                marginBottom: 12,
              }}
            >
              {bench.description}
            </Text>
          )}

          {/* Discoverer + visit count */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}
            onPress={() => router.push(`/user/${bench.discoverer.id}`)}
          >
            {bench.discoverer.avatar_url ? (
              <Image
                source={{ uri: resolvePhotoUrl(bench.discoverer.avatar_url) }}
                style={{ width: 24, height: 24, borderRadius: 12 }}
              />
            ) : (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#e8e4dc',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12 }}>👤</Text>
              </View>
            )}
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#7a6652' }}>
              Discovered by {bench.discoverer.username}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
              · {bench.visits_count} {bench.visits_count === 1 ? 'visit' : 'visits'}
            </Text>
          </TouchableOpacity>

          {/* Aggregate score breakdown */}
          {bench.average_rating && bench.ratings_count > 0 && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: '#e8e4dc',
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1b4332', marginBottom: 10 }}
              >
                Ratings · {bench.ratings_count}{' '}
                {bench.ratings_count === 1 ? 'rater' : 'raters'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <ScoreChip label="Overall" value={bench.average_rating.overall} />
                <ScoreChip label="View" value={bench.average_rating.view} />
                <ScoreChip label="Comfort" value={bench.average_rating.comfort} />
                <ScoreChip label="Location" value={bench.average_rating.location} />
              </View>
            </View>
          )}

          {/* Add-your-visit CTA — check-ins (photos + rating) happen in the post flow */}
          {user && (
            <TouchableOpacity
              style={{
                backgroundColor: '#2d6a4f',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 20,
              }}
              onPress={() => router.push(`/post?benchId=${bench.id}`)}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#f8f6f1' }}>
                + Add your visit
              </Text>
            </TouchableOpacity>
          )}

          {/* Mini-map */}
          <View
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              height: 160,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#e8e4dc',
            }}
          >
            <MapView
              style={{ flex: 1 }}
              region={{
                latitude: bench.latitude,
                longitude: bench.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: bench.latitude, longitude: bench.longitude }}
                pinColor="#2d6a4f"
              />
            </MapView>
          </View>

          {/* Visit timeline */}
          <Text
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#1b4332', marginBottom: 12 }}
          >
            Visits{visits.length > 0 ? ` (${visits.length})` : ''}
          </Text>
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
          {visits.length === 0 && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652', marginBottom: 12 }}>
              No visits yet.
            </Text>
          )}

          {/* Comments */}
          <Text
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#1b4332', marginTop: 8, marginBottom: 12 }}
          >
            Comments{comments.length > 0 ? ` (${comments.length})` : ''}
          </Text>

          {comments.map((comment: CommentItem) => (
            <View
              key={comment.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e8e4dc',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TouchableOpacity onPress={() => router.push(`/user/${comment.user.id}`)}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#2d6a4f' }}>
                    {comment.user.username}
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
                  ·{' '}
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#1b4332', lineHeight: 20 }}
              >
                {comment.body}
              </Text>
            </View>
          ))}

          {comments.length === 0 && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652', marginBottom: 12 }}>
              No comments yet. Be the first!
            </Text>
          )}

          {/* Add comment */}
          {user && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#e8e4dc',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: '#1b4332',
                  minHeight: 42,
                }}
                placeholder="Add a comment…"
                placeholderTextColor="#7a6652"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={{
                  backgroundColor: commentText.trim() ? '#2d6a4f' : '#e8e4dc',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 42,
                }}
                onPress={() => submitComment.mutate()}
                disabled={!commentText.trim() || submitComment.isPending}
              >
                {submitComment.isPending ? (
                  <ActivityIndicator color="#f8f6f1" size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 13,
                      color: commentText.trim() ? '#f8f6f1' : '#7a6652',
                    }}
                  >
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
