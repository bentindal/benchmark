import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { benchApi, visitApi, type BenchItem } from '../../lib/api';
import { resolvePhotoUrl } from '../../lib/images';

// 'new' flow:  photos → location → [dedup] → details
// 'visit' flow: photos → rate  (started from bench detail or dedup selection)
type Step = 'photos' | 'location' | 'dedup' | 'details' | 'rate';

function StarInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1b4332', marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={6}>
            <Ionicons
              name={value !== null && n <= value ? 'star' : 'star-outline'}
              size={30}
              color="#2d6a4f"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function PostScreen() {
  const params = useLocalSearchParams<{ benchId?: string }>();
  const initialBenchId = params.benchId ? parseInt(params.benchId, 10) : null;

  const [mode, setMode] = useState<'new' | 'visit'>(initialBenchId ? 'visit' : 'new');
  const [step, setStep] = useState<Step>(initialBenchId ? 'photos' : 'photos');
  const [targetBenchId, setTargetBenchId] = useState<number | null>(initialBenchId);
  const [nearbyBenches, setNearbyBenches] = useState<BenchItem[]>([]);

  // Shared across both flows
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [viewScore, setViewScore] = useState<number | null>(null);
  const [comfortScore, setComfortScore] = useState<number | null>(null);
  const [locationScore, setLocationScore] = useState<number | null>(null);

  // New bench only
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locating, setLocating] = useState(false);
  const [checkingNearby, setCheckingNearby] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const qc = useQueryClient();

  const buildVisitFields = (fd: FormData) => {
    photos.forEach((uri, i) => {
      fd.append('photos[]', { uri, type: 'image/jpeg', name: `photo_${i}.jpg` } as any);
    });
    if (note.trim()) fd.append('note', note.trim());
    if (overallScore) fd.append('overall_score', String(overallScore));
    if (viewScore) fd.append('view_score', String(viewScore));
    if (comfortScore) fd.append('comfort_score', String(comfortScore));
    if (locationScore) fd.append('location_score', String(locationScore));
  };

  const visitMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      buildVisitFields(fd);
      return visitApi.create(targetBenchId!, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bench', targetBenchId] });
      qc.invalidateQueries({ queryKey: ['benches'] });
      router.push(`/bench/${targetBenchId}`);
    },
    onError: () => Alert.alert('Error', 'Failed to check in. Please try again.'),
  });

  const benchMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      buildVisitFields(fd);
      fd.append('bench[title]', title);
      if (description.trim()) fd.append('bench[description]', description.trim());
      fd.append('bench[latitude]', String(coords!.lat));
      fd.append('bench[longitude]', String(coords!.lng));
      if (locationName.trim()) fd.append('bench[location_name]', locationName.trim());
      return benchApi.create(fd);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['benches'] });
      router.push(`/bench/${res.data.id}`);
    },
    onError: () => Alert.alert('Error', 'Failed to create bench. Please try again.'),
  });

  const isPending = visitMutation.isPending || benchMutation.isPending;

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const locateMe = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  };

  const proceedFromLocation = async () => {
    if (!coords) return;
    setCheckingNearby(true);
    try {
      const res = await benchApi.nearby({ lat: coords.lat, lng: coords.lng, radius: 0.05 });
      if (res.data.length > 0) {
        setNearbyBenches(res.data);
        setStep('dedup');
      } else {
        setStep('details');
      }
    } catch {
      setStep('details');
    } finally {
      setCheckingNearby(false);
    }
  };

  const selectExistingBench = (bench: BenchItem) => {
    setTargetBenchId(bench.id);
    setMode('visit');
    setStep('rate');
  };

  // ---- Render helpers ----

  const renderPhotos = (nextStep: Step) => (
    <View>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1b4332', marginBottom: 8 }}>
        Add photos (up to 5)
      </Text>
      {photos.length > 0 && (
        <FlatList
          data={photos}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 12 }}
          renderItem={({ item, index }) => (
            <View>
              <Image source={{ uri: item }} style={{ width: 100, height: 100, borderRadius: 10 }} resizeMode="cover" />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 99,
                  padding: 3,
                }}
                onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
              >
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      {photos.length < 5 && (
        <TouchableOpacity
          style={{
            borderWidth: 1.5,
            borderColor: '#e8e4dc',
            borderStyle: 'dashed',
            borderRadius: 12,
            paddingVertical: 24,
            alignItems: 'center',
            gap: 8,
          }}
          onPress={pickPhotos}
        >
          <Ionicons name="camera-outline" size={28} color="#2d6a4f" />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#2d6a4f' }}>
            {photos.length === 0 ? 'Select photos' : 'Add more'}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={{
          backgroundColor: '#2d6a4f',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 20,
        }}
        onPress={() => setStep(nextStep)}
        disabled={photos.length === 0}
      >
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#f8f6f1' }}>
          {nextStep === 'location' ? 'Next: Location' : 'Next: Rate'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRatingFields = () => (
    <View>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1b4332', marginBottom: 16 }}>
        Rate this bench (optional)
      </Text>
      <StarInput label="Overall" value={overallScore} onChange={setOverallScore} />
      <StarInput label="View" value={viewScore} onChange={setViewScore} />
      <StarInput label="Comfort" value={comfortScore} onChange={setComfortScore} />
      <StarInput label="Location" value={locationScore} onChange={setLocationScore} />
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1b4332', marginBottom: 6, marginTop: 4 }}>
        Note (optional)
      </Text>
      <TextInput
        style={{
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#e8e4dc',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: 'Inter_400Regular',
          fontSize: 14,
          color: '#1b4332',
          height: 88,
          textAlignVertical: 'top',
          marginBottom: 20,
        }}
        placeholder="Anything special about this visit?"
        placeholderTextColor="#7a6652"
        value={note}
        onChangeText={setNote}
        multiline
      />
    </View>
  );

  const isVisitMode = mode === 'visit';

  // Step labels & count differ by mode
  const stepLabels = isVisitMode ? ['Photos', 'Rate'] : ['Photos', 'Location', 'Details'];
  const currentStepIndex = isVisitMode
    ? (['photos', 'rate'] as Step[]).indexOf(step)
    : (['photos', 'location', 'details'] as Step[]).indexOf(step);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f6f1' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: '#1b4332' }}>
            {isVisitMode ? 'Check In' : 'Add a Bench'}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652', marginTop: 2 }}>
            {isVisitMode ? 'Log your visit with photos and a rating' : 'Share a bench with the community'}
          </Text>
        </View>

        {/* Step indicator (not shown on dedup screen) */}
        {step !== 'dedup' && (
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
            {stepLabels.map((label, i) => (
              <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: currentStepIndex >= i ? '#2d6a4f' : '#e8e4dc',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 13,
                      color: currentStepIndex >= i ? '#f8f6f1' : '#7a6652',
                    }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: currentStepIndex === i ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    fontSize: 11,
                    color: currentStepIndex === i ? '#2d6a4f' : '#7a6652',
                  }}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Step: Photos ── */}
        {step === 'photos' && renderPhotos(isVisitMode ? 'rate' : 'location')}

        {/* ── Step: Location (new bench only) ── */}
        {step === 'location' && (
          <View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1b4332', marginBottom: 8 }}>
              Where is this bench?
            </Text>

            <TouchableOpacity
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: coords ? '#f0faf4' : '#e8e4dc',
                borderWidth: 1,
                borderColor: coords ? '#74c69d' : '#e8e4dc',
                marginBottom: 12,
              }}
              onPress={locateMe}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator color="#2d6a4f" size="small" />
              ) : (
                <Ionicons name="location" size={18} color="#2d6a4f" />
              )}
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#2d6a4f', flex: 1 }}>
                {coords
                  ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                  : 'Use my current location'}
              </Text>
              {coords && <Ionicons name="checkmark-circle" size={18} color="#2d6a4f" />}
            </TouchableOpacity>

            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1b4332', marginBottom: 6 }}>
              Location name (optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e8e4dc',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: '#1b4332',
                marginBottom: 20,
              }}
              placeholder="e.g. Central Park, by the fountain"
              placeholderTextColor="#7a6652"
              value={locationName}
              onChangeText={setLocationName}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e8e4dc',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => setStep('photos')}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#7a6652' }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: coords ? '#2d6a4f' : '#e8e4dc',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={proceedFromLocation}
                disabled={!coords || checkingNearby}
              >
                {checkingNearby ? (
                  <ActivityIndicator color="#f8f6f1" size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 15,
                      color: coords ? '#f8f6f1' : '#7a6652',
                    }}
                  >
                    Next: Details
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step: Dedup (is this an existing bench?) ── */}
        {step === 'dedup' && (
          <View style={{ paddingTop: 8 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1b4332', marginBottom: 6 }}>
              Is this one of these benches?
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652', marginBottom: 16 }}>
              We found benches nearby. Check in on an existing one instead of adding a duplicate.
            </Text>

            {nearbyBenches.map((bench) => {
              const photo = resolvePhotoUrl(bench.cover_photo_url);
              return (
                <TouchableOpacity
                  key={bench.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#e8e4dc',
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflow: 'hidden',
                    marginBottom: 10,
                  }}
                  onPress={() => selectExistingBench(bench)}
                  activeOpacity={0.8}
                >
                  {photo ? (
                    <Image source={{ uri: photo }} style={{ width: 72, height: 72 }} resizeMode="cover" />
                  ) : (
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        backgroundColor: '#e8e4dc',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 28 }}>🪑</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, padding: 12 }}>
                    <Text
                      style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1b4332' }}
                      numberOfLines={1}
                    >
                      {bench.title}
                    </Text>
                    {bench.location_name ? (
                      <Text
                        style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7a6652', marginTop: 2 }}
                        numberOfLines={1}
                      >
                        📍 {bench.location_name}
                      </Text>
                    ) : null}
                    {bench.distance_km != null && (
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#2d6a4f', marginTop: 2 }}>
                        {bench.distance_km < 1
                          ? `${Math.round(bench.distance_km * 1000)} m away`
                          : `${bench.distance_km.toFixed(1)} km away`}
                      </Text>
                    )}
                  </View>
                  <View style={{ paddingRight: 14 }}>
                    <Ionicons name="chevron-forward" size={18} color="#7a6652" />
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={{
                borderWidth: 1.5,
                borderColor: '#2d6a4f',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 4,
                marginBottom: 8,
              }}
              onPress={() => setStep('details')}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#2d6a4f' }}>
                None of these — it's a new bench
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignItems: 'center', paddingVertical: 8 }}
              onPress={() => setStep('location')}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652' }}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: Details (new bench: title + description + rating + note) ── */}
        {step === 'details' && (
          <View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1b4332', marginBottom: 6 }}>
              Title *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e8e4dc',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: '#1b4332',
                marginBottom: 14,
              }}
              placeholder="e.g. Shaded park bench with a view"
              placeholderTextColor="#7a6652"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1b4332', marginBottom: 6 }}>
              Description (optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e8e4dc',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: '#1b4332',
                height: 80,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
              placeholder="What makes this bench special?"
              placeholderTextColor="#7a6652"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {renderRatingFields()}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e8e4dc',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => setStep(nearbyBenches.length > 0 ? 'dedup' : 'location')}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#7a6652' }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: title.trim() ? '#2d6a4f' : '#e8e4dc',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => benchMutation.mutate()}
                disabled={!title.trim() || isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#f8f6f1" />
                ) : (
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 15,
                      color: title.trim() ? '#f8f6f1' : '#7a6652',
                    }}
                  >
                    Post Bench
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step: Rate (visit mode: rating + note + submit) ── */}
        {step === 'rate' && (
          <View>
            {renderRatingFields()}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e8e4dc',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => setStep('photos')}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#7a6652' }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: '#2d6a4f',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => visitMutation.mutate()}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#f8f6f1" />
                ) : (
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#f8f6f1' }}>
                    Check In
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
