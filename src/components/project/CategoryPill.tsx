import { View, Text, StyleSheet } from 'react-native';

interface CategoryPillProps {
  name: string;
  color: string;
  size?: 'small' | 'medium';
}

export function CategoryPill({ name, color, size = 'small' }: CategoryPillProps) {
  return (
    <View
      style={[
        styles.container,
        size === 'medium' && styles.containerMedium,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[styles.text, size === 'medium' && styles.textMedium]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    color: '#ccc',
    fontWeight: '500',
  },
  textMedium: {
    fontSize: 13,
  },
});
