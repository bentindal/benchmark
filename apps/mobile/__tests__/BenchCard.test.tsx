import React from 'react';
import { render, screen } from '@testing-library/react-native';
import BenchCard from '../components/BenchCard';
import type { BenchItem } from '../lib/api';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('nativewind', () => ({
  styled: (component: unknown) => component,
}));

const mockBench: BenchItem = {
  id: 1,
  title: 'Central Park Bench',
  description: 'A lovely bench in the park',
  latitude: 40.785091,
  longitude: -73.968285,
  location_name: 'Central Park',
  created_at: '2024-01-01T00:00:00Z',
  photos_urls: [],
  average_rating: {
    view: 4.5,
    comfort: 3.8,
    location: 4.2,
    overall: 4.2,
  },
  ratings_count: 5,
  comments_count: 2,
  user: { id: 1, username: 'testuser', avatar_url: null },
  distance_km: 0.5,
};

describe('BenchCard', () => {
  it('renders bench title', () => {
    render(<BenchCard bench={mockBench} />);
    expect(screen.getByText('Central Park Bench')).toBeTruthy();
  });

  it('renders rating count', () => {
    render(<BenchCard bench={mockBench} />);
    expect(screen.getByText(/5 ratings/)).toBeTruthy();
  });

  it('renders username', () => {
    render(<BenchCard bench={mockBench} />);
    expect(screen.getByText('testuser')).toBeTruthy();
  });

  it('renders distance when provided', () => {
    render(<BenchCard bench={mockBench} />);
    expect(screen.getByText(/500 m away/)).toBeTruthy();
  });

  it('renders location name', () => {
    render(<BenchCard bench={mockBench} />);
    expect(screen.getByText('Central Park')).toBeTruthy();
  });

  it('renders placeholder when no photo', () => {
    render(<BenchCard bench={{ ...mockBench, photos_urls: [] }} />);
    expect(screen.getByText('🪑')).toBeTruthy();
  });

  it('shows singular "rating" for count of 1', () => {
    render(<BenchCard bench={{ ...mockBench, ratings_count: 1 }} />);
    expect(screen.getByText(/1 rating/)).toBeTruthy();
  });
});
