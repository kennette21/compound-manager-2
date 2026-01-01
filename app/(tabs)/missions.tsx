import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '../../src/stores/propertyStore';
import { useMissionStore } from '../../src/stores/missionStore';
import { useMissions, useStartMission } from '../../src/hooks/useMissions';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import type { Mission } from '../../src/types';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDistance(meters: number | null): string {
  if (!meters) return '-- m';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MissionCard({
  mission,
  onPress,
}: {
  mission: Mission;
  onPress: () => void;
}) {
  const statusColors = {
    active: '#22c55e',
    completed: '#4f46e5',
    cancelled: '#ef4444',
  };

  return (
    <TouchableOpacity style={styles.missionCard} onPress={onPress}>
      <View style={styles.missionHeader}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: statusColors[mission.status] },
          ]}
        />
        <Text style={styles.missionDate}>{formatDate(mission.started_at)}</Text>
      </View>

      <View style={styles.missionStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatDuration(mission.duration_seconds)}
          </Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatDistance(mission.distance_meters)}
          </Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
      </View>

      {mission.notes && (
        <Text style={styles.missionNotes} numberOfLines={2}>
          {mission.notes}
        </Text>
      )}

      {mission.project && (
        <View style={styles.projectTag}>
          <Text style={styles.projectTagText}>{mission.project.title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MissionsScreen() {
  const { activeProperty } = usePropertyStore();
  const { activeMission, startMission } = useMissionStore();
  const { data: missions, isLoading, refetch, isRefetching } = useMissions(activeProperty?.id);
  const startMissionMutation = useStartMission();
  const [startingMission, setStartingMission] = useState(false);

  const handleMissionPress = useCallback((missionId: string) => {
    router.push(`/mission/${missionId}`);
  }, []);

  const handleActiveMissionPress = useCallback(() => {
    router.push('/mission/active');
  }, []);

  const handleStartMission = async () => {
    if (!activeProperty) {
      Alert.alert('No Property', 'Please select a property first in Settings');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Required',
        'Location permission is required to track missions'
      );
      return;
    }

    setStartingMission(true);
    try {
      const mission = await startMissionMutation.mutateAsync({
        property_id: activeProperty.id,
      });
      startMission(mission);
      router.push('/mission/active');
    } catch {
      Alert.alert('Error', 'Failed to start mission');
    } finally {
      setStartingMission(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Active Mission Banner */}
      {activeMission && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={handleActiveMissionPress}
        >
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Mission in progress</Text>
          <Text style={styles.activeArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Mission List */}
      <FlatList
        data={missions}
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
            title="No Missions"
            message="Tap the + button to start tracking a work session"
          />
        }
        renderItem={({ item }) => (
          <MissionCard
            mission={item}
            onPress={() => handleMissionPress(item.id)}
          />
        )}
      />

      {/* Start Mission FAB - only show when no active mission */}
      {!activeMission && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleStartMission}
          disabled={startingMission}
        >
          {startingMission ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="play" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  activeText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeArrow: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  missionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  missionDate: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  missionStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  stat: {
    gap: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  missionNotes: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  projectTag: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  projectTagText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
