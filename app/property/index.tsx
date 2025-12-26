import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { usePropertyStore } from '../../src/stores/propertyStore';
import { useAuthStore } from '../../src/stores/authStore';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';
import type { Property, PropertyMember } from '../../src/types';

function useUserProperties() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async (): Promise<(PropertyMember & { property: Property })[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('property_members')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export default function PropertyListScreen() {
  const { activeProperty, setActiveProperty } = usePropertyStore();
  const { data: memberships, isLoading, refetch, isRefetching } = useUserProperties();

  const handleSelectProperty = useCallback(
    (property: Property) => {
      setActiveProperty(property);
      router.back();
    },
    [setActiveProperty]
  );

  const handlePropertyDetails = useCallback((propertyId: string) => {
    router.push(`/property/${propertyId}`);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Properties',
        }}
      />
      <View style={styles.container}>
        <FlatList
          data={memberships}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#4f46e5"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Properties"
              message="You haven't been added to any properties yet. Ask the property owner to invite you."
            />
          }
          renderItem={({ item }) => {
            const isActive = activeProperty?.id === item.property.id;
            return (
              <TouchableOpacity
                style={[styles.propertyCard, isActive && styles.propertyCardActive]}
                onPress={() => handleSelectProperty(item.property)}
                onLongPress={() => handlePropertyDetails(item.property.id)}
              >
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>{item.property.name}</Text>
                  {item.property.description && (
                    <Text style={styles.propertyDescription} numberOfLines={2}>
                      {item.property.description}
                    </Text>
                  )}
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                    </Text>
                  </View>
                </View>
                {isActive && (
                  <View style={styles.activeIndicator}>
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  propertyCardActive: {
    borderColor: '#4f46e5',
  },
  propertyInfo: {
    flex: 1,
    gap: 4,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  propertyDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  activeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
  },
  activeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
