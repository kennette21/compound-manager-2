import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';
import type { Project } from '../../types';

interface ProjectMarkersProps {
  projects: Project[];
  onSelect?: (project: Project) => void;
  selectedId?: string;
}

const STATUS_COLORS = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  completed: '#22c55e',
};

export function ProjectMarkers({ projects, onSelect, selectedId }: ProjectMarkersProps) {
  const handleMarkerPress = useCallback((project: Project) => {
    onSelect?.(project);
  }, [onSelect]);

  return (
    <>
      {projects.map((project) => {
        if (!project.location) return null;

        const isSelected = project.id === selectedId;
        const color = STATUS_COLORS[project.status];
        const categoryColor = project.category?.color || color;

        return (
          <PointAnnotation
            key={project.id}
            id={project.id}
            coordinate={project.location.coordinates}
            onSelected={() => handleMarkerPress(project)}
          >
            <View
              style={[
                styles.marker,
                {
                  backgroundColor: categoryColor,
                  borderColor: isSelected ? '#fff' : color,
                  width: isSelected ? 32 : 28,
                  height: isSelected ? 32 : 28,
                  borderRadius: isSelected ? 16 : 14,
                },
              ]}
            />
          </PointAnnotation>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
  },
});
