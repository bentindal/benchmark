import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(err);
  }
);

// ---- Types ----

export interface BenchItem {
  id: number;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  location_name: string | null;
  created_at: string;
  photos_urls: string[];
  average_rating: {
    view: number | null;
    comfort: number | null;
    location: number | null;
    overall: number | null;
  } | null;
  ratings_count: number;
  comments_count: number;
  user: { id: number; username: string; avatar_url: string | null };
  distance_km?: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  bio: string | null;
  avatar_url: string | null;
  benches_count?: number;
  followers_count?: number;
  following_count?: number;
}

export interface RatingItem {
  id: number;
  view_score: number;
  comfort_score: number;
  location_score: number;
  overall_score: number;
  user_id: number;
  bench_id: number;
  created_at: string;
  user?: { id: number; username: string; avatar_url: string | null };
}

export interface CommentItem {
  id: number;
  body: string;
  created_at: string;
  user: { id: number; username: string; avatar_url: string | null };
}

export interface BenchDetail {
  bench: BenchItem;
  ratings: RatingItem[];
  comments: CommentItem[];
}

// ---- Auth ----

export const authApi = {
  signUp: (data: { email: string; password: string; password_confirmation: string; username: string }) =>
    api.post<{ token: string; user: UserProfile }>('/sign_up', data),
  signIn: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: UserProfile }>('/sign_in', data),
  signOut: () => api.delete('/sign_out'),
  me: () => api.get<UserProfile>('/me'),
};

// ---- Benches ----

export const benchApi = {
  list: (params?: { page?: number; per_page?: number; sort?: string }) =>
    api.get<BenchItem[]>('/benches', { params }),
  get: (id: number) => api.get<BenchDetail>(`/benches/${id}`),
  create: (formData: FormData) =>
    api.post<BenchItem>('/benches', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch<BenchItem>(`/benches/${id}`, data),
  delete: (id: number) => api.delete(`/benches/${id}`),
  nearby: (params: { lat: number; lng: number; radius?: number }) =>
    api.get<BenchItem[]>('/benches/nearby', { params }),
};

// ---- Ratings ----

export const ratingApi = {
  list: (benchId: number) =>
    api.get<{ ratings: RatingItem[]; current_user_rating: RatingItem | null }>(`/benches/${benchId}/ratings`),
  create: (benchId: number, data: {
    view_score: number; comfort_score?: number; location_score?: number; overall_score: number
  }) => api.post<RatingItem>(`/benches/${benchId}/ratings`, data),
  update: (benchId: number, ratingId: number, data: Record<string, unknown>) =>
    api.patch<RatingItem>(`/benches/${benchId}/ratings/${ratingId}`, data),
};

// ---- Comments ----

export const commentApi = {
  list: (benchId: number, params?: { page?: number; per_page?: number }) =>
    api.get<CommentItem[]>(`/benches/${benchId}/comments`, { params }),
  create: (benchId: number, body: string) =>
    api.post<CommentItem>(`/benches/${benchId}/comments`, { body }),
  delete: (benchId: number, commentId: number) =>
    api.delete(`/benches/${benchId}/comments/${commentId}`),
};

// ---- Users ----

export const userApi = {
  get: (id: number) => api.get<{ user: UserProfile; benches: BenchItem[] }>(`/users/${id}`),
  update: (id: number, data: { username?: string; bio?: string }) =>
    api.patch<UserProfile>(`/users/${id}`, data),
};

// ---- Feed ----

export const feedApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    api.get<BenchItem[]>('/feed', { params }),
};