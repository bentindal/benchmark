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
import { benchApi } from '../../lib/api';

type Step = 1 | 2 | 3;

export default function PostScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  const [step, setStep] = useState<Step>(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    params.lat && params.lng
      ? { lat: parseFloat(params.lat), lng: parseFloat(params.lng) }
      : null,
  );
  const [locationName, setLocationName] = useState('');
  const [locating, setLocating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('bench[title]', title);
      if (description) formData.append('bench[description]', description);
      formData.append('bench[latitude]', String(coords!.lat));
      formData.append('bench[longitude]', String(coords!.lng));
      if (locationName) formData.append('bench[location_name]', locationName);
      photos.forEach((uri, i) => {
        formData.append('bench[photos][]', {
          uri,
          type: 'image/jpeg',
          name: `photo_${i}.jpg`,
        } as any);
      });
      return benchApi.create(formData);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['benches'] });
      router.push(`/bench/${res.data.id}`);
    },
    onError: () => Alert.alert('Error', 'Failed to create bench. Please try again.'),
  });

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

  const stepTitles = ['Photos', 'Location', 'Details'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f6f1' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: '#1b4332' }}>
            Add a Bench
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a6652', marginTop: 2 }}>
            Share a bench with the community
          </Text>
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
          {([1, 2, 3] as Step[]).map((s) => (
            <View key={s} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: step >= s ? '#2d6a4f' : '#e8e4dc',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                    color: step >= s ? '#f8f6f1' : '#7a6652',
                  }}
                >
                  {s}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: step === s ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  fontSize: 11,
                  color: step === s ? '#2d6a4f' : '#7a6652',
                }}
              >
                {stepTitles[s - 1]}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Photos */}
        {step === 1 && (
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
                    <Image
                      source={{ uri: item }}
                      style={{ width: 100, height: 100, borderRadius: 10 }}
                      resizeMode="cover"
                    />
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
              onPress={() => setStep(2)}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#f8f6f1' }}>
                Next: Location
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
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
                onPress={() => setStep(1)}
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
                onPress={() => setStep(3)}
                disabled={!coords}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 15,
                    color: coords ? '#f8f6f1' : '#7a6652',
                  }}
                >
                  Next: Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1b4332', marginBottom: 8 }}>
              Tell us about the bench
            </Text>

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
                height: 96,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
              placeholder="What makes this bench special?"
              placeholderTextColor="#7a6652"
              value={description}
              onChangeText={setDescription}
              multiline
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
                onPress={() => setStep(2)}
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
                onPress={() => mutate()}
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
      </ScrollView>
    </SafeAreaView>
  );
}
