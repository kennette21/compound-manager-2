import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Project } from '../../types';
import { StatusBadge } from './StatusBadge';
import { CategoryPill } from './CategoryPill';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const priorityColors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: priorityColors[project.priority] },
            ]}
          />
          <Text style={styles.title} numberOfLines={1}>
            {project.title}
          </Text>
        </View>
        <StatusBadge status={project.status} />
      </View>

      {project.description && (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      <View style={styles.footer}>
        {project.category && (
          <CategoryPill
            name={project.category.name}
            color={project.category.color}
          />
        )}
        {project.due_date && (
          <Text style={styles.dueDate}>
            Due: {new Date(project.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
  },
});
