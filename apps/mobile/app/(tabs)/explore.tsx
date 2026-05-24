import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { benchApi, type BenchItem } from '../../lib/api';

const DEFAULT_REGION: Region = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function ExploreScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['benches', 'map'],
    queryFn: () => benchApi.list({ per_page: 200 }).then((r) => r.data),
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const userRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setRegion(userRegion);
        mapRef.current?.animateToRegion(userRegion, 800);
      }
      setLocationReady(true);
    })();
  }, []);

  // Navigate to map position if coming from post screen with pre-filled location
  useEffect(() => {
    if (params.lat && params.lng) {
      const r: Region = {
        latitude: parseFloat(params.lat),
        longitude: parseFloat(params.lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(r);
      mapRef.current?.animateToRegion(r, 600);
    }
  }, [params.lat, params.lng]);

  const benches: BenchItem[] = data ?? [];

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={(r) => setRegion(r)}
        showsUserLocation
        showsMyLocationButton
      >
        {benches.map((bench) => (
          <Marker
            key={bench.id}
            coordinate={{ latitude: bench.latitude, longitude: bench.longitude }}
            pinColor="#2d6a4f"
          >
            <Callout onPress={() => router.push(`/bench/${bench.id}`)}>
              <View style={{ minWidth: 160, padding: 4 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1b4332' }}>
                  {bench.title}
                </Text>
                {bench.average_rating?.overall ? (
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652', marginTop: 2 }}>
                    ★ {bench.average_rating.overall.toFixed(1)} · {bench.ratings_count} ratings
                  </Text>
                ) : null}
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#2d6a4f', marginTop: 4 }}>
                  Tap to view →
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {!locationReady && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(248,246,241,0.6)',
          }}
        >
          <ActivityIndicator color="#2d6a4f" size="large" />
        </View>
      )}

      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#2d6a4f',
            borderRadius: 99,
            paddingVertical: 12,
            alignItems: 'center',
          }}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/post',
              params: { lat: String(region.latitude), lng: String(region.longitude) },
            })
          }
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#f8f6f1', fontSize: 14 }}>
            + Post bench here
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#f8f6f1',
            borderRadius: 99,
            paddingVertical: 12,
            paddingHorizontal: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#e8e4dc',
          }}
          onPress={() => refetch()}
          disabled={isFetching}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', color: '#2d6a4f', fontSize: 14 }}>
            {isFetching ? '…' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
