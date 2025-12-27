import { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Mapbox, { Camera, MapView as MapboxMapView, UserLocation } from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useMissionStore } from '../../src/stores/missionStore';
import { useEndMission, useCancelMission, pointsToLineString } from '../../src/hooks/useMissions';
import { useAddPhoto } from '../../src/hooks/usePhotos';
import { MissionTrack } from '../../src/components/map/MissionTrack';
import { captureAndUploadPhoto } from '../../src/lib/storage';

export default function ActiveMissionScreen() {
  const mapRef = useRef<MapboxMapView>(null);
  const cameraRef = useRef<Camera>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const {
    activeMission,
    trackPoints,
    startTime,
    elapsedSeconds,
    distance,
    addTrackPoint,
    updateElapsed,
    endMission,
    cancelMission,
  } = useMissionStore();

  const endMissionMutation = useEndMission();
  const cancelMissionMutation = useCancelMission();
  const addPhotoMutation = useAddPhoto();
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  // Start location tracking
  useEffect(() => {
    const startTracking = async () => {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // every 5 seconds
          distanceInterval: 10, // or every 10 meters
        },
        (location) => {
          addTrackPoint({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            altitude: location.coords.altitude ?? undefined,
            speed: location.coords.speed ?? undefined,
            timestamp: location.timestamp,
          });
        }
      );
    };

    if (activeMission) {
      startTracking();
    }

    return () => {
      locationSubscription.current?.remove();
    };
  }, [activeMission, addTrackPoint]);

  // Timer
  useEffect(() => {
    if (startTime) {
      timerInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateElapsed(elapsed);
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [startTime, updateElapsed]);

  const handleEndMission = useCallback(async () => {
    if (!activeMission) return;

    Alert.alert('End Mission', 'Save this mission and stop tracking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Mission',
        onPress: async () => {
          try {
            await endMissionMutation.mutateAsync({
              id: activeMission.id,
              track: pointsToLineString(trackPoints),
              distance_meters: distance,
              duration_seconds: elapsedSeconds,
            });
            endMission();
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to save mission');
          }
        },
      },
    ]);
  }, [activeMission, trackPoints, distance, elapsedSeconds, endMissionMutation, endMission]);

  const handleCancelMission = useCallback(async () => {
    if (!activeMission) return;

    Alert.alert(
      'Cancel Mission',
      'Discard this mission? All tracking data will be lost.',
      [
        { text: 'Keep Tracking', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMissionMutation.mutateAsync(activeMission.id);
              cancelMission();
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel mission');
            }
          },
        },
      ]
    );
  }, [activeMission, cancelMissionMutation, cancelMission]);

  const handleCenterOnTrack = useCallback(() => {
    if (trackPoints.length > 0) {
      const lastPoint = trackPoints[trackPoints.length - 1];
      cameraRef.current?.setCamera({
        centerCoordinate: [lastPoint.longitude, lastPoint.latitude],
        zoomLevel: 16,
        animationDuration: 500,
      });
    }
  }, [trackPoints]);

  const handleTakePhoto = useCallback(async () => {
    if (!activeMission) return;

    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    setIsCapturing(true);
    try {
      // Get current location for geotagging
      const location = await Location.getCurrentPositionAsync({});

      // Capture photo
      const result = await captureAndUploadPhoto({
        missionId: activeMission.id,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });

      if (result) {
        // Save to database
        await addPhotoMutation.mutateAsync({
          mission_id: activeMission.id,
          storage_path: result.storagePath,
          thumbnail_path: result.thumbnailPath,
          location: {
            type: 'Point',
            coordinates: [location.coords.longitude, location.coords.latitude],
          },
          photo_type: 'during',
        });
        setPhotoCount((prev) => prev + 1);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  }, [activeMission, addPhotoMutation]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  if (!activeMission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No active mission</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const lastPoint = trackPoints[trackPoints.length - 1];

  return (
    <View style={styles.container}>
      <MapboxMapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.SatelliteStreet}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: lastPoint
              ? [lastPoint.longitude, lastPoint.latitude]
              : [-122.4194, 37.7749],
            zoomLevel: 16,
          }}
          followUserLocation={true}
        />

        <UserLocation visible={true} />

        {trackPoints.length > 0 && <MissionTrack points={trackPoints} showPoints />}
      </MapboxMapView>

      {/* Stats Overlay */}
      <SafeAreaView style={styles.statsOverlay}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{trackPoints.length}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{photoCount}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCenterOnTrack}
        >
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.cameraButton]}
          onPress={handleTakePhoto}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="camera" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <SafeAreaView style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelMission}
        >
          <Text style={styles.cancelButtonText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endButton} onPress={handleEndMission}>
          <Text style={styles.endButtonText}>End Mission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  map: {
    flex: 1,
  },
  statsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a4e',
  },
  controls: {
    position: 'absolute',
    top: 120,
    right: 16,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraButton: {
    backgroundColor: '#4f46e5',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  endButton: {
    flex: 2,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 48,
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
