import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { userApi, type BenchItem } from '../../lib/api';
import BenchCard from '../../components/BenchCard';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = parseInt(id, 10);

  const { data, isLoading } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.get(userId).then((r) => r.data),
  });

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f6f1', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2d6a4f" size="large" />
      </View>
    );
  }

  const { user, benches } = data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f6f1' }} edges={['bottom']}>
      <FlatList
        data={benches}
        keyExtractor={(item: BenchItem) => String(item.id)}
        renderItem={({ item }: { item: BenchItem }) => (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <BenchCard bench={item} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            {/* Profile header */}
            <View
              style={{
                alignItems: 'center',
                paddingTop: 24,
                paddingBottom: 20,
                paddingHorizontal: 24,
                borderBottomWidth: 1,
                borderBottomColor: '#e8e4dc',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#e8e4dc',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  overflow: 'hidden',
                }}
              >
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={{ width: 72, height: 72 }} />
                ) : (
                  <Text style={{ fontSize: 28 }}>👤</Text>
                )}
              </View>

              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1b4332' }}>
                {user.username}
              </Text>

              {user.bio ? (
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                    color: '#7a6652',
                    textAlign: 'center',
                    marginTop: 6,
                    lineHeight: 20,
                  }}
                >
                  {user.bio}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 32, marginTop: 14 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1b4332' }}>
                    {user.benches_count ?? benches.length}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
                    Benches
                  </Text>
                </View>
                {user.followers_count != null && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1b4332' }}>
                      {user.followers_count}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
                      Followers
                    </Text>
                  </View>
                )}
                {user.following_count != null && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1b4332' }}>
                      {user.following_count}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
                      Following
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {benches.length > 0 && (
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 15,
                  color: '#1b4332',
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                Benches by {user.username}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652' }}>
              No benches posted yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
