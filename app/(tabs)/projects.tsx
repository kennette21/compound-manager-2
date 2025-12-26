import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { usePropertyStore } from '../../src/stores/propertyStore';
import { useProjects } from '../../src/hooks/useProjects';
import { ProjectCard } from '../../src/components/project/ProjectCard';
import { StatusBadge } from '../../src/components/project/StatusBadge';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import type { ProjectStatus } from '../../src/types';

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Completed', value: 'completed' },
];

export default function ProjectsScreen() {
  const { activeProperty } = usePropertyStore();
  const { data: projects, isLoading, refetch, isRefetching } = useProjects(activeProperty?.id);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  const filteredProjects = projects?.filter((project) => {
    if (statusFilter === 'all') return true;
    return project.status === statusFilter;
  });

  const handleProjectPress = useCallback((projectId: string) => {
    router.push(`/project/${projectId}`);
  }, []);

  const handleNewProject = useCallback(() => {
    router.push('/project/new');
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Project List */}
      <FlatList
        data={filteredProjects}
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
            title="No Projects"
            message={
              statusFilter === 'all'
                ? "You haven't created any projects yet"
                : `No projects with status "${statusFilter.replace('_', ' ')}"`
            }
            actionLabel="Create Project"
            onAction={handleNewProject}
          />
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => handleProjectPress(item.id)}
          />
        )}
      />

      {/* FAB for new project */}
      <TouchableOpacity style={styles.fab} onPress={handleNewProject}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  filterContainer: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a4e',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
  },
  filterChipText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
});
