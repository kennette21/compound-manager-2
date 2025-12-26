// Database types matching Supabase schema

export type PropertyRole = 'owner' | 'member';
export type ProjectStatus = 'pending' | 'in_progress' | 'review' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high';
export type PhotoType = 'before' | 'during' | 'after' | 'general';
export type MissionStatus = 'active' | 'completed' | 'cancelled';

// GeoJSON types for PostGIS compatibility
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONPolygon | GeoJSONLineString;

// Core entities
export interface Property {
  id: string;
  name: string;
  description: string | null;
  boundary: GeoJSONPolygon | null;
  center_lat: number | null;
  center_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  property_id: string;
  name: string;
  color: string;
  icon: string | null;
  display_order: number;
}

export interface Project {
  id: string;
  property_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  assigned_to: string | null;
  location: GeoJSONPoint | null;
  area: GeoJSONGeometry | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
}

export interface Photo {
  id: string;
  project_id: string | null;
  mission_id: string | null;
  storage_path: string;
  thumbnail_path: string | null;
  location: GeoJSONPoint | null;
  captured_at: string;
  photo_type: PhotoType;
  notes: string | null;
  created_at: string;
  // Computed fields
  url?: string;
  thumbnail_url?: string;
}

export interface Mission {
  id: string;
  property_id: string;
  project_id: string | null;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  track: GeoJSONLineString | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  status: MissionStatus;
  notes: string | null;
  created_at: string;
  // Joined fields
  project?: Project;
  photos?: Photo[];
}

export interface MissionPoint {
  id: string;
  mission_id: string;
  location: GeoJSONPoint;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  recorded_at: string;
}

export interface PropertyMember {
  id: string;
  property_id: string;
  user_id: string;
  role: PropertyRole;
  invited_by: string | null;
  joined_at: string;
  // Joined fields
  property?: Property;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// User profile (from Supabase Auth)
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

// App-specific types
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
}

export interface DrawingState {
  mode: 'none' | 'point' | 'polygon' | 'polyline';
  points: [number, number][];
  isDrawing: boolean;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
