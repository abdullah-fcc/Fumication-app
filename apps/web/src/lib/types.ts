// Shared domain types used across pages and API calls.
// Keep these in sync with the database schema in apps/api/src/db/schema.sql

export interface Location {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  contact_person: string | null;
  contact_phone: string | null;
  client_id: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  warehouse_id: string | null;
  warehouse_name: string | null;
  supplier: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker' | 'client';
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location_id: string | null;
  location_name: string | null;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
}
