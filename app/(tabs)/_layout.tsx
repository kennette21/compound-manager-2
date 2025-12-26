import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { usePropertyStore } from '../../src/stores/propertyStore';
import { useMissionStore } from '../../src/stores/missionStore';

// Simple icon components (replace with proper icons later)
const TabIcon = ({
  name,
  focused,
  badge,
}: {
  name: string;
  focused: boolean;
  badge?: boolean;
}) => (
  <View style={styles.iconContainer}>
    <Text style={[styles.iconText, focused && styles.iconTextFocused]}>
      {name}
    </Text>
    {badge && <View style={styles.badge} />}
  </View>
);

export default function TabsLayout() {
  const { activeProperty } = usePropertyStore();
  const { activeMission } = useMissionStore();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a4e',
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#888',
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          headerTitle: activeProperty?.name || 'Compound Manager',
          tabBarIcon: ({ focused }) => <TabIcon name="M" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused }) => <TabIcon name="P" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="T"
              focused={focused}
              badge={activeMission !== null}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="S" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  iconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  iconTextFocused: {
    color: '#4f46e5',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});
