import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { CommentItem } from '../lib/api';

type Props = {
  comment: CommentItem;
};

export default function CommentItemComp({ comment }: Props) {
  const date = new Date(comment.created_at).toLocaleDateString();

  return (
    <View className="px-4 py-4 border-b border-bench-stone">
      <TouchableOpacity
        className="flex-row items-center mb-2"
        onPress={() => router.push(`/user/${comment.user.id}`)}
      >
        <View className="w-8 h-8 rounded-full bg-bench-sage items-center justify-center mr-2 overflow-hidden">
          {comment.user.avatar_url ? (
            <Image source={{ uri: comment.user.avatar_url }} className="w-full h-full" />
          ) : (
            <Text className="text-sm">👤</Text>
          )}
        </View>
        <View>
          <Text className="font-inter-semibold text-bench-moss text-sm">
            {comment.user.username}
          </Text>
          <Text className="font-inter text-bench-bark text-xs">{date}</Text>
        </View>
      </TouchableOpacity>

      <Text className="font-inter text-bench-moss text-sm mt-2">{comment.body}</Text>
    </View>
  );
}