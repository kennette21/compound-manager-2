import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Project, ProjectStatus, ProjectPriority, GeoJSONGeometry, GeoJSONPoint } from '../types';

interface CreateProjectInput {
  property_id: string;
  category_id?: string;
  title: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  location?: GeoJSONPoint;
  area?: GeoJSONGeometry;
  due_date?: string;
  assigned_to?: string;
}

interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

// Fetch all projects for a property
export function useProjects(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['projects', propertyId],
    queryFn: async (): Promise<Project[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Fetch a single project
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project | null> => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// Create a new project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput): Promise<Project> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Convert GeoJSON to PostGIS format for the insert
      const insertData: Record<string, unknown> = {
        ...input,
        created_by: user.user.id,
        status: input.status || 'pending',
        priority: input.priority || 'medium',
      };

      // Handle geometry fields - convert to PostGIS format
      if (input.location) {
        insertData.location = `POINT(${input.location.coordinates[0]} ${input.location.coordinates[1]})`;
      }
      if (input.area) {
        insertData.area = JSON.stringify(input.area);
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.property_id] });
    },
  });
}

// Update a project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProjectInput): Promise<Project> => {
      const updateData: Record<string, unknown> = { ...input };

      // Handle geometry fields
      if (input.location) {
        updateData.location = `POINT(${input.location.coordinates[0]} ${input.location.coordinates[1]})`;
      }
      if (input.area) {
        updateData.area = JSON.stringify(input.area);
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
    },
  });
}

// Delete a project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
