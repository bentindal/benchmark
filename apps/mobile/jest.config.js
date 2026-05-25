/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|zustand|nativewind|react-native-*))',
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};