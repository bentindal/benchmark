import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';

const mockSignIn = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: mockRouterReplace },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../lib/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ signIn: mockSignIn }),
}));

jest.mock('nativewind', () => ({
  styled: (component: unknown) => component,
}));

// Synchronous require to avoid dynamic import issues with jest
let SignIn: React.ComponentType;
beforeAll(() => {
  SignIn = require('../app/(auth)/sign-in').default;
});

describe('SignIn screen', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockRouterReplace.mockReset();
  });

  it('renders email and password inputs', () => {
    render(<SignIn />);
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders sign in button', () => {
    render(<SignIn />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
  });

  it('shows error when submitting empty fields', async () => {
    render(<SignIn />);
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeTruthy();
    });
  });

  it('calls signIn with email and password on submit', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<SignIn />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('navigates to tabs on successful sign in', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<SignIn />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows error message on failed sign in', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Unauthorized'));
    render(<SignIn />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'bad@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeTruthy();
    });
  });
});
