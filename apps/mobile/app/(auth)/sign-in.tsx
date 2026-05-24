import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../lib/auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bench-cream"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="font-inter-bold text-4xl text-bench-moss mb-2">BenchMark</Text>
        <Text className="font-inter text-bench-bark text-base mb-10">
          Rate the world's benches.
        </Text>

        {error ? (
          <Text className="text-red-600 text-sm mb-4 font-inter">{error}</Text>
        ) : null}

        <TextInput
          className="bg-white border border-bench-stone rounded-xl px-4 py-3 font-inter text-bench-moss mb-3"
          placeholder="Email"
          placeholderTextColor="#7a6652"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          className="bg-white border border-bench-stone rounded-xl px-4 py-3 font-inter text-bench-moss mb-6"
          placeholder="Password"
          placeholderTextColor="#7a6652"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          className="bg-bench-green rounded-xl py-4 items-center mb-4"
          onPress={handleSignIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {loading ? (
            <ActivityIndicator color="#f8f6f1" />
          ) : (
            <Text className="font-inter-semibold text-bench-cream text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="font-inter text-bench-bark">Don't have an account? </Text>
          <Link href="/(auth)/sign-up">
            <Text className="font-inter-semibold text-bench-green">Sign Up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
