export type StationType = 'air_quality' | 'weather' | 'emissions';
export type AlertOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  city: string;
  type: StationType;
  is_active: boolean;
  created_at: string;
}

export interface Reading {
  id: number;
  station_id: number;
  metric: string;
  value: number;
  unit: string;
  recorded_at: string;
  source: string | null;
}

export interface ReadingSummary {
  station_id: number;
  metric: string;
  unit: string;
  date: string;
  avg: number;
  min: number;
  max: number;
}

export interface Alert {
  id: number;
  user_id: number;
  station_id: number;
  metric: string;
  operator: AlertOperator;
  threshold: number;
  is_active: boolean;
  last_triggered_at: string | null;
  station?: Station;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
