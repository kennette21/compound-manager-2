import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { usePropertyStore } from '../../stores/propertyStore';
import { useMissionStore } from '../../stores/missionStore';
import { useStartMission, useEndMission, pointsToLineString } from '../../hooks/useMissions';

export function MissionFAB() {
  const { activeProperty } = usePropertyStore();
  const { activeMission, trackPoints, elapsedSeconds, distance, startMission, endMission } =
    useMissionStore();
  const startMissionMutation = useStartMission();
  const endMissionMutation = useEndMission();
  const [loading, setLoading] = useState(false);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const handleStartMission = async () => {
    if (!activeProperty) {
      Alert.alert('No Property', 'Please select a property first');
      return;
    }

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Required',
        'Location permission is required to track missions'
      );
      return;
    }

    setLoading(true);
    try {
      const mission = await startMissionMutation.mutateAsync({
        property_id: activeProperty.id,
      });
      startMission(mission);
      router.push('/mission/active');
    } catch (error) {
      Alert.alert('Error', 'Failed to start mission');
    } finally {
      setLoading(false);
    }
  };

  const handleEndMission = async () => {
    if (!activeMission) return;

    Alert.alert('End Mission', 'Are you sure you want to end this mission?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Mission',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await endMissionMutation.mutateAsync({
              id: activeMission.id,
              track: pointsToLineString(trackPoints),
              distance_meters: distance,
              duration_seconds: elapsedSeconds,
            });
            endMission();
          } catch (error) {
            Alert.alert('Error', 'Failed to end mission');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleViewMission = () => {
    router.push('/mission/active');
  };

  if (activeMission) {
    return (
      <View style={styles.activeMissionContainer}>
        <TouchableOpacity
          style={styles.activeMissionInfo}
          onPress={handleViewMission}
        >
          <View style={styles.missionDot} />
          <View style={styles.missionStats}>
            <Text style={styles.missionTime}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.missionDistance}>{formatDistance(distance)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndMission}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.endButtonText}>End</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={handleStartMission}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabLabel}>Start Mission</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fabLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeMissionContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeMissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  missionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  missionStats: {
    gap: 2,
  },
  missionTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  missionDistance: {
    color: '#888',
    fontSize: 12,
  },
  endButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
