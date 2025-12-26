import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useProject, useUpdateProject, useDeleteProject } from '../../src/hooks/useProjects';
import { useProjectPhotos } from '../../src/hooks/usePhotos';
import { StatusBadge } from '../../src/components/project/StatusBadge';
import { CategoryPill } from '../../src/components/project/CategoryPill';
import { PhotoGallery } from '../../src/components/photos/PhotoGallery';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import type { ProjectStatus } from '../../src/types';

const STATUS_FLOW: ProjectStatus[] = ['pending', 'in_progress', 'review', 'completed'];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: project, isLoading, refetch, isRefetching } = useProject(id);
  const { data: photos } = useProjectPhotos(id);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = useCallback(async () => {
    if (!project) return;

    const currentIndex = STATUS_FLOW.indexOf(project.status);
    if (currentIndex >= STATUS_FLOW.length - 1) return;

    const nextStatus = STATUS_FLOW[currentIndex + 1];

    setUpdating(true);
    try {
      await updateProject.mutateAsync({
        id: project.id,
        status: nextStatus,
      });
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }, [project, updateProject, refetch]);

  const handleEdit = useCallback(() => {
    router.push(`/project/edit/${id}`);
  }, [id]);

  const handleDelete = useCallback(() => {
    if (!project) return;

    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject.mutateAsync(project.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  }, [project, deleteProject]);

  const handleAddPhoto = useCallback(() => {
    // TODO: Implement photo capture
    Alert.alert('Coming Soon', 'Photo capture will be added soon');
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const priorityLabels = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
  };

  const priorityColors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(project.status) + 1];

  return (
    <>
      <Stack.Screen
        options={{
          title: project.title,
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.headerButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#4f46e5"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{project.title}</Text>
            <StatusBadge status={project.status} size="medium" />
          </View>

          <View style={styles.metaRow}>
            {project.category && (
              <CategoryPill
                name={project.category.name}
                color={project.category.color}
                size="medium"
              />
            )}
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColors[project.priority] + '20' },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: priorityColors[project.priority] },
                ]}
              >
                {priorityLabels[project.priority]}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{project.description}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            {project.due_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(project.due_date).toLocaleDateString()}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {new Date(project.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location Type</Text>
              <Text style={styles.detailValue}>
                {project.location ? 'Point' : project.area ? 'Area' : 'None'}
              </Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity onPress={handleAddPhoto}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {photos && photos.length > 0 ? (
            <PhotoGallery photos={photos} />
          ) : (
            <View style={styles.emptyPhotos}>
              <Text style={styles.emptyText}>No photos yet</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {nextStatus && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleStatusChange}
              disabled={updating}
            >
              <Text style={styles.actionButtonText}>
                {updating ? 'Updating...' : `Move to ${nextStatus.replace('_', ' ')}`}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Project</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  headerButton: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  addButton: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
  },
  emptyPhotos: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
  },
  deleteButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 48,
  },
});
