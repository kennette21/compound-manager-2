import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PointAnnotation, Callout } from '@rnmapbox/maps';
import { router } from 'expo-router';
import type { Project } from '../../types';

interface ProjectMarkersProps {
  projects: Project[];
}

const STATUS_COLORS = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  completed: '#22c55e',
};

export function ProjectMarkers({ projects }: ProjectMarkersProps) {
  const handleMarkerPress = useCallback((projectId: string) => {
    router.push(`/project/${projectId}`);
  }, []);

  return (
    <>
      {projects.map((project) => {
        if (!project.location) return null;

        const color = STATUS_COLORS[project.status];
        const categoryColor = project.category?.color || color;

        return (
          <PointAnnotation
            key={project.id}
            id={project.id}
            coordinate={project.location.coordinates}
            onSelected={() => handleMarkerPress(project.id)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: categoryColor, borderColor: color },
                ]}
              >
                <View style={[styles.markerInner, { backgroundColor: color }]} />
              </View>
              <View style={[styles.markerTail, { borderTopColor: categoryColor }]} />
            </View>
            <Callout title={project.title}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{project.title}</Text>
                {project.description && (
                  <Text style={styles.calloutDescription} numberOfLines={2}>
                    {project.description}
                  </Text>
                )}
                <Text style={styles.calloutStatus}>
                  {project.status.replace('_', ' ')}
                </Text>
              </View>
            </Callout>
          </PointAnnotation>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  callout: {
    minWidth: 150,
    maxWidth: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutStatus: {
    fontSize: 11,
    color: '#888',
    textTransform: 'capitalize',
  },
});
