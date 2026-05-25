import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { benchApi, type BenchItem } from '../../lib/api';
import BenchCard from '../../components/BenchCard';

type Tab = 'recent' | 'top' | 'nearby';

const TABS: { key: Tab; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'top', label: 'Top Rated' },
  { key: 'nearby', label: 'Nearby' },
];

const PER_PAGE = 20;

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('recent');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationFetchedRef = useRef(false);

  // Request location when switching to Nearby tab
  useEffect(() => {
    if (activeTab !== 'nearby') return;
    if (userLocation) return;
    if (locationFetchedRef.current) return;

    locationFetchedRef.current = true;
    setLocationLoading(true);
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Needed', 'Enable location to see nearby benches.');
        setLocationLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch {
        Alert.alert('Error', 'Could not get your location.');
      }
      setLocationLoading(false);
    })();
  }, [activeTab, userLocation]);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['benches', 'feed', activeTab, userLocation?.lat, userLocation?.lng],
      queryFn: ({ pageParam }) => {
        if (activeTab === 'nearby' && userLocation) {
          return benchApi
            .nearby({ lat: userLocation.lat, lng: userLocation.lng, radius: 50 })
            .then((r) => r.data);
        }
        return benchApi
          .list({ page: pageParam, per_page: PER_PAGE, sort: activeTab === 'top' ? 'rating' : 'recent' })
          .then((r) => r.data);
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === PER_PAGE ? allPages.length + 1 : undefined,
      enabled: activeTab !== 'nearby' || !!userLocation,
    });

  const benches = data?.pages.flat() ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bench-cream" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="font-inter-bold text-3xl text-bench-moss">BenchMark</Text>
        <Text className="font-inter text-bench-bark text-sm">Discover great places to sit</Text>
      </View>

      {/* Tab switcher */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: '#e8e4dc',
          borderRadius: 10,
          padding: 3,
        }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: activeTab === tab.key ? '#fff' : 'transparent',
            }}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text
              style={{
                fontFamily: activeTab === tab.key ? 'Inter_600SemiBold' : 'Inter_400Regular',
                fontSize: 13,
                color: activeTab === tab.key ? '#2d6a4f' : '#7a6652',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading || (activeTab === 'nearby' && locationLoading) ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2d6a4f" size="large" />
        </View>
      ) : (
        <FlatList
          data={benches}
          keyExtractor={(item: BenchItem) => String(item.id)}
          renderItem={({ item }: { item: BenchItem }) => <BenchCard bench={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2d6a4f" />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator color="#2d6a4f" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🪑</Text>
              <Text className="font-inter-semibold text-bench-moss text-lg">No benches yet</Text>
              <Text className="font-inter text-bench-bark text-sm mt-1">
                Be the first to add one!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
