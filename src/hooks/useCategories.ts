import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

interface CreateCategoryInput {
  property_id: string;
  name: string;
  color: string;
  icon?: string;
}

// Fetch all categories for a property
export function useCategories(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['categories', propertyId],
    queryFn: async (): Promise<Category[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Create a new category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput): Promise<Category> => {
      // Get the max display_order for this property
      const { data: existing } = await supabase
        .from('categories')
        .select('display_order')
        .eq('property_id', input.property_id)
        .order('display_order', { ascending: false })
        .limit(1);

      const maxOrder = existing?.[0]?.display_order ?? 0;

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...input,
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.property_id] });
    },
  });
}

// Update a category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<Category> & { id: string }): Promise<Category> => {
      const { data, error } = await supabase
        .from('categories')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.property_id] });
    },
  });
}

// Delete a category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      propertyId,
    }: {
      categoryId: string;
      propertyId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['categories', variables.propertyId],
      });
    },
  });
}

// Default categories to create for new properties
export const DEFAULT_CATEGORIES = [
  { name: 'Path Clearing', color: '#22c55e', icon: 'path' },
  { name: 'Building', color: '#3b82f6', icon: 'building' },
  { name: 'Invasive Species', color: '#ef4444', icon: 'warning' },
  { name: 'Maintenance', color: '#f59e0b', icon: 'tool' },
  { name: 'Planting', color: '#10b981', icon: 'plant' },
  { name: 'Fencing', color: '#6366f1', icon: 'fence' },
];
