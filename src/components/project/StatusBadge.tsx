import { View, Text, StyleSheet } from 'react-native';
import type { ProjectStatus } from '../../types';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  pending: {
    label: 'Pending',
    bgColor: '#4a4458',
    textColor: '#c4b5fd',
  },
  in_progress: {
    label: 'In Progress',
    bgColor: '#1e3a5f',
    textColor: '#60a5fa',
  },
  review: {
    label: 'Review',
    bgColor: '#422006',
    textColor: '#fbbf24',
  },
  completed: {
    label: 'Completed',
    bgColor: '#14532d',
    textColor: '#4ade80',
  },
};

export function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bgColor },
        size === 'medium' && styles.containerMedium,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.textColor },
          size === 'medium' && styles.textMedium,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textMedium: {
    fontSize: 13,
  },
});
