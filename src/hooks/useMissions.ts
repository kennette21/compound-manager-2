import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Mission, MissionStatus, GeoJSONLineString, LocationCoords } from '../types';

interface CreateMissionInput {
  property_id: string;
  project_id?: string;
}

interface EndMissionInput {
  id: string;
  track: GeoJSONLineString;
  distance_meters: number;
  duration_seconds: number;
  notes?: string;
}

// Fetch all missions for a property
export function useMissions(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['missions', propertyId],
    queryFn: async (): Promise<Mission[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          project:projects(id, title)
        `)
        .eq('property_id', propertyId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Fetch a single mission
export function useMission(missionId: string | undefined) {
  return useQuery({
    queryKey: ['mission', missionId],
    queryFn: async (): Promise<Mission | null> => {
      if (!missionId) return null;

      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          project:projects(id, title),
          photos(*)
        `)
        .eq('id', missionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!missionId,
  });
}

// Start a new mission
export function useStartMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMissionInput): Promise<Mission> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('missions')
        .insert({
          ...input,
          user_id: user.user.id,
          started_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['missions', data.property_id] });
    },
  });
}

// End a mission
export function useEndMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EndMissionInput): Promise<Mission> => {
      const { id, track, ...rest } = input;

      // Convert track to PostGIS format
      const trackWKT = `LINESTRING(${track.coordinates
        .map((coord) => `${coord[0]} ${coord[1]}`)
        .join(', ')})`;

      const { data, error } = await supabase
        .from('missions')
        .update({
          ...rest,
          track: trackWKT,
          ended_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['missions', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['mission', data.id] });
    },
  });
}

// Cancel a mission
export function useCancelMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (missionId: string): Promise<Mission> => {
      const { data, error } = await supabase
        .from('missions')
        .update({
          ended_at: new Date().toISOString(),
          status: 'cancelled',
        })
        .eq('id', missionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['missions', data.property_id] });
    },
  });
}

// Save mission points (for syncing track data)
export function useSaveMissionPoints() {
  return useMutation({
    mutationFn: async ({
      missionId,
      points,
    }: {
      missionId: string;
      points: LocationCoords[];
    }): Promise<void> => {
      const missionPoints = points.map((point) => ({
        mission_id: missionId,
        location: `POINT(${point.longitude} ${point.latitude})`,
        accuracy: point.accuracy,
        altitude: point.altitude,
        speed: point.speed,
        recorded_at: new Date(point.timestamp).toISOString(),
      }));

      const { error } = await supabase
        .from('mission_points')
        .insert(missionPoints);

      if (error) throw error;
    },
  });
}

// Helper to convert track points to GeoJSON LineString
export function pointsToLineString(points: LocationCoords[]): GeoJSONLineString {
  return {
    type: 'LineString',
    coordinates: points.map((p) => [p.longitude, p.latitude]),
  };
}
