import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getStorageUrl } from '../lib/supabase';
import type { Photo, PhotoType, GeoJSONPoint } from '../types';

interface CreatePhotoInput {
  project_id?: string;
  mission_id?: string;
  file: Blob | ArrayBuffer;
  fileName: string;
  location?: GeoJSONPoint;
  photo_type?: PhotoType;
  notes?: string;
}

// Fetch photos for a project
export function useProjectPhotos(projectId: string | undefined) {
  return useQuery({
    queryKey: ['photos', 'project', projectId],
    queryFn: async (): Promise<Photo[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('project_id', projectId)
        .order('captured_at', { ascending: false });

      if (error) throw error;

      // Add URLs to photos
      return (data || []).map((photo) => ({
        ...photo,
        url: getStorageUrl('photos', photo.storage_path),
        thumbnail_url: photo.thumbnail_path
          ? getStorageUrl('photos', photo.thumbnail_path)
          : undefined,
      }));
    },
    enabled: !!projectId,
  });
}

// Fetch photos for a mission
export function useMissionPhotos(missionId: string | undefined) {
  return useQuery({
    queryKey: ['photos', 'mission', missionId],
    queryFn: async (): Promise<Photo[]> => {
      if (!missionId) return [];

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('mission_id', missionId)
        .order('captured_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((photo) => ({
        ...photo,
        url: getStorageUrl('photos', photo.storage_path),
        thumbnail_url: photo.thumbnail_path
          ? getStorageUrl('photos', photo.thumbnail_path)
          : undefined,
      }));
    },
    enabled: !!missionId,
  });
}

// Upload and create a photo
export function useCreatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePhotoInput): Promise<Photo> => {
      const { file, fileName, location, ...rest } = input;

      // Generate storage path
      const timestamp = Date.now();
      const folder = input.project_id
        ? `projects/${input.project_id}`
        : input.mission_id
          ? `missions/${input.mission_id}`
          : 'general';
      const storagePath = `${folder}/${timestamp}-${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, file, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database record
      const insertData: Record<string, unknown> = {
        ...rest,
        storage_path: storagePath,
        captured_at: new Date().toISOString(),
        photo_type: input.photo_type || 'general',
      };

      if (location) {
        insertData.location = `POINT(${location.coordinates[0]} ${location.coordinates[1]})`;
      }

      const { data, error } = await supabase
        .from('photos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        url: getStorageUrl('photos', data.storage_path),
      };
    },
    onSuccess: (data) => {
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'project', data.project_id],
        });
      }
      if (data.mission_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'mission', data.mission_id],
        });
      }
    },
  });
}

interface AddPhotoInput {
  project_id?: string;
  mission_id?: string;
  storage_path: string;
  thumbnail_path?: string;
  location?: GeoJSONPoint;
  photo_type?: PhotoType;
  notes?: string;
}

// Add a photo record (file already uploaded to storage)
export function useAddPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPhotoInput): Promise<Photo> => {
      const { location, ...rest } = input;
      const insertData: Record<string, unknown> = {
        ...rest,
        captured_at: new Date().toISOString(),
        photo_type: input.photo_type || 'general',
      };

      // Convert GeoJSON to PostGIS format
      if (location?.coordinates) {
        insertData.location = `POINT(${location.coordinates[0]} ${location.coordinates[1]})`;
      }

      const { data, error } = await supabase
        .from('photos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        url: getStorageUrl('photos', data.storage_path),
      };
    },
    onSuccess: (data) => {
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'project', data.project_id],
        });
      }
      if (data.mission_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'mission', data.mission_id],
        });
      }
    },
  });
}

// Delete a photo
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: Photo): Promise<void> => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      // Delete thumbnail if exists
      if (photo.thumbnail_path) {
        await supabase.storage.from('photos').remove([photo.thumbnail_path]);
      }

      // Delete database record
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;
    },
    onSuccess: (_, photo) => {
      if (photo.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'project', photo.project_id],
        });
      }
      if (photo.mission_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'mission', photo.mission_id],
        });
      }
    },
  });
}

// Update photo metadata
export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<Photo> & { id: string }): Promise<Photo> => {
      const { data, error } = await supabase
        .from('photos')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        url: getStorageUrl('photos', data.storage_path),
      };
    },
    onSuccess: (data) => {
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'project', data.project_id],
        });
      }
      if (data.mission_id) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'mission', data.mission_id],
        });
      }
    },
  });
}
