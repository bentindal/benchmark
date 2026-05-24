import { View, Image, TouchableOpacity, Text, Dimensions } from 'react-native';

type Props = {
  photos: string[];
  compact?: boolean;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PhotoGrid({ photos, compact = false }: Props) {
  if (photos.length === 0) return null;

  const imageSize = compact
    ? (SCREEN_WIDTH - 48 - 8) / 3
    : SCREEN_WIDTH;

  if (!compact && photos.length === 1) {
    return (
      <Image
        source={{ uri: photos[0] }}
        style={{ width: SCREEN_WIDTH, height: 260 }}
        resizeMode="cover"
      />
    );
  }

  if (!compact && photos.length === 2) {
    return (
      <View className="flex-row gap-0.5">
        {photos.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{ width: SCREEN_WIDTH / 2 - 1, height: 200 }}
            resizeMode="cover"
          />
        ))}
      </View>
    );
  }

  const displayed = compact ? photos.slice(0, 3) : photos.slice(0, 4);
  const remaining = photos.length - displayed.length;

  return (
    <View className="flex-row flex-wrap gap-1">
      {displayed.map((uri, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.85}
          style={{ width: imageSize, height: imageSize }}
        >
          <Image
            source={{ uri }}
            style={{ width: imageSize, height: imageSize, borderRadius: 6 }}
            resizeMode="cover"
          />
          {i === displayed.length - 1 && remaining > 0 && (
            <View
              className="absolute inset-0 bg-black/40 rounded-md items-center justify-center"
              style={{ borderRadius: 6 }}
            >
              <Text className="text-white font-inter-bold text-lg">+{remaining}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
