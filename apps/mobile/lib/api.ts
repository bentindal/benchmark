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

export interface UserBrief {
  id: number;
  username: string;
  avatar_url: string | null;
}

export interface AverageRating {
  view: number | null;
  comfort: number | null;
  location: number | null;
  overall: number | null;
}

// A bench is a shared place. Imagery is derived from its visits (cover + gallery),
// the rating aggregates each visitor's latest rated visit, and `discoverer` is the
// user who first added it.
export interface BenchItem {
  id: number;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  location_name: string | null;
  created_at: string;
  cover_photo_url: string | null;
  gallery_urls: string[];
  average_rating: AverageRating | null;
  ratings_count: number;
  visits_count: number;
  comments_count: number;
  discoverer: UserBrief;
  distance_km?: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  bio: string | null;
  avatar_url: string | null;
  discovered_count?: number;
  visits_count?: number;
  followers_count?: number;
  following_count?: number;
}

// A user's contribution to a bench: photos + an optional rating + a note.
export interface VisitItem {
  id: number;
  note: string | null;
  view_score: number | null;
  comfort_score: number | null;
  location_score: number | null;
  overall_score: number | null;
  user_id: number;
  bench_id: number;
  created_at: string;
  photos_urls: string[];
  user?: UserBrief;
}

// Feed entries are visits enriched with a summary of their bench.
export interface FeedVisitItem extends VisitItem {
  bench: {
    id: number;
    title: string;
    location_name: string | null;
    latitude: number;
    longitude: number;
    cover_photo_url: string | null;
  };
}

export interface CommentItem {
  id: number;
  body: string;
  created_at: string;
  user: UserBrief;
}

export interface BenchDetail {
  bench: BenchItem;
  visits: VisitItem[];
  comments: CommentItem[];
  current_user_visits?: VisitItem[];
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

// ---- Visits ----
// A visit (check-in) is photos + an optional rating + a note. `create` adds the
// current user to an existing bench; creating a brand-new bench (benchApi.create)
// records the discoverer's first visit in the same request.

export const visitApi = {
  listForBench: (benchId: number) =>
    api.get<VisitItem[]>(`/benches/${benchId}/visits`),
  create: (benchId: number, formData: FormData) =>
    api.post<VisitItem>(`/benches/${benchId}/visits`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (visitId: number, data: Record<string, unknown>) =>
    api.patch<VisitItem>(`/visits/${visitId}`, data),
  delete: (visitId: number) => api.delete(`/visits/${visitId}`),
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
  get: (id: number) =>
    api.get<{ user: UserProfile; discovered: BenchItem[]; visited: BenchItem[] }>(`/users/${id}`),
  update: (id: number, data: { username?: string; bio?: string }) =>
    api.patch<UserProfile>(`/users/${id}`, data),
};

// ---- Feed ----

export const feedApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    api.get<FeedVisitItem[]>('/feed', { params }),
};