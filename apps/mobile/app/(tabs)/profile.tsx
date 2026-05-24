import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { userApi, authApi, type BenchItem } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import BenchCard from '../../components/BenchCard';

export default function ProfileScreen() {
  const { user: authUser, signOut } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['users', authUser?.id],
    queryFn: () => userApi.get(authUser!.id).then((r) => r.data),
    enabled: !!authUser?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  if (isLoading || !authUser) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f6f1', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2d6a4f" size="large" />
      </View>
    );
  }

  const profile = data?.user ?? authUser;
  const benches: BenchItem[] = data?.benches ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f6f1' }} edges={['top']}>
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
            <View style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 20, paddingHorizontal: 24 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#e8e4dc',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  overflow: 'hidden',
                }}
              >
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80 }} />
                ) : (
                  <Text style={{ fontSize: 32 }}>👤</Text>
                )}
              </View>

              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#1b4332' }}>
                {profile.username}
              </Text>

              {profile.bio ? (
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
                  {profile.bio}
                </Text>
              ) : null}

              {/* Stats */}
              <View style={{ flexDirection: 'row', gap: 32, marginTop: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1b4332' }}>
                    {profile.benches_count ?? benches.length}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
                    Benches
                  </Text>
                </View>
                {profile.followers_count != null && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1b4332' }}>
                      {profile.followers_count}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
                      Followers
                    </Text>
                  </View>
                )}
                {profile.following_count != null && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1b4332' }}>
                      {profile.following_count}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652' }}>
                      Following
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#e8e4dc',
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
                onPress={() => {}}
                accessibilityLabel="Edit profile"
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1b4332' }}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#e8e4dc',
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                }}
                onPress={handleSignOut}
                accessibilityLabel="Sign out"
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#7a6652' }}>
                  Sign Out
                </Text>
              </TouchableOpacity>
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
                My Benches
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652' }}>
              No benches posted yet
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 12,
                backgroundColor: '#2d6a4f',
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
              onPress={() => router.push('/(tabs)/post')}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#f8f6f1' }}>
                Add your first bench
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
