export type UserRole = 'admin' | 'manager' | 'worker' | 'client';

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  location_id: string;
  assigned_worker_ids: string[];
  scheduled_at: string;
  completed_at?: string;
  notes?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  client_id: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  warehouse_id: string;
  low_stock_threshold: number;
}

export interface Report {
  id: string;
  job_id: string;
  worker_id: string;
  pests_found: string[];
  chemicals_used: string[];
  areas_treated: string[];
  before_photos: string[];
  after_photos: string[];
  worker_signature?: string;
  client_signature?: string;
  created_at: string;
}
