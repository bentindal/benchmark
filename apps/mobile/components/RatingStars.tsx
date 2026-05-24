import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

export default function RatingStars({ rating, size = 16, interactive = false, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const half = !filled && star - 0.5 <= rating;
        const color = filled ? '#2d6a4f' : half ? '#74c69d' : '#e8e4dc';

        const starEl = (
          <Text key={star} style={{ fontSize: size, color, lineHeight: size * 1.2 }}>
            ★
          </Text>
        );

        if (interactive && onChange) {
          return (
            <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
              {starEl}
            </TouchableOpacity>
          );
        }

        return starEl;
      })}
    </View>
  );
}
