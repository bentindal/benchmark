import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../lib/auth';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(email.trim(), password, username.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bench-cream"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}>
        <Text className="font-inter-bold text-4xl text-bench-moss mb-2">Create Account</Text>
        <Text className="font-inter text-bench-bark text-base mb-10">
          Join the bench community.
        </Text>

        {error ? (
          <Text className="text-red-600 text-sm mb-4 font-inter">{error}</Text>
        ) : null}

        <TextInput
          className="bg-white border border-bench-stone rounded-xl px-4 py-3 font-inter text-bench-moss mb-3"
          placeholder="Username"
          placeholderTextColor="#7a6652"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username-new"
        />

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
          className="bg-white border border-bench-stone rounded-xl px-4 py-3 font-inter text-bench-moss mb-3"
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#7a6652"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        <TextInput
          className="bg-white border border-bench-stone rounded-xl px-4 py-3 font-inter text-bench-moss mb-6"
          placeholder="Confirm password"
          placeholderTextColor="#7a6652"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        <TouchableOpacity
          className="bg-bench-green rounded-xl py-4 items-center mb-4"
          onPress={handleSignUp}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          {loading ? (
            <ActivityIndicator color="#f8f6f1" />
          ) : (
            <Text className="font-inter-semibold text-bench-cream text-base">Create Account</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="font-inter text-bench-bark">Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text className="font-inter-semibold text-bench-green">Sign In</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
