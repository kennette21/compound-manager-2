import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Mapbox, { Camera, MapView as MapboxMapView } from '@rnmapbox/maps';
import { useMission } from '../../src/hooks/useMissions';
import { useMissionPhotos } from '../../src/hooks/usePhotos';
import { MissionTrack } from '../../src/components/map/MissionTrack';
import { PhotoGallery } from '../../src/components/photos/PhotoGallery';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapboxMapView>(null);
  const { data: mission, isLoading, refetch, isRefetching } = useMission(id);
  const { data: photos } = useMissionPhotos(id);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number | null): string => {
    if (!meters) return '-- m';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!mission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Mission not found</Text>
      </View>
    );
  }

  // Convert track to points for display
  const trackPoints = mission.track?.coordinates?.map((coord) => ({
    longitude: coord[0],
    latitude: coord[1],
    timestamp: 0,
  })) || [];

  const centerCoord = trackPoints.length > 0
    ? [
        trackPoints.reduce((sum, p) => sum + p.longitude, 0) / trackPoints.length,
        trackPoints.reduce((sum, p) => sum + p.latitude, 0) / trackPoints.length,
      ]
    : [-122.4194, 37.7749];

  const statusColors = {
    active: '#22c55e',
    completed: '#4f46e5',
    cancelled: '#ef4444',
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: formatDate(mission.started_at),
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
        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <MapboxMapView
            ref={mapRef}
            style={styles.map}
            styleURL={Mapbox.StyleURL.SatelliteStreet}
            logoEnabled={false}
            attributionEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Camera
              defaultSettings={{
                centerCoordinate: centerCoord,
                zoomLevel: 14,
              }}
            />
            {trackPoints.length > 0 && (
              <MissionTrack points={trackPoints} color="#4f46e5" />
            )}
          </MapboxMapView>
        </View>

        {/* Status */}
        <View style={styles.statusBar}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors[mission.status] },
            ]}
          />
          <Text style={[styles.statusText, { color: statusColors[mission.status] }]}>
            {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDuration(mission.duration_seconds)}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDistance(mission.distance_meters)}
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </View>

        {/* Time Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started</Text>
              <Text style={styles.detailValue}>
                {formatTime(mission.started_at)}
              </Text>
            </View>
            {mission.ended_at && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ended</Text>
                <Text style={styles.detailValue}>
                  {formatTime(mission.ended_at)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Project */}
        {mission.project && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Linked Project</Text>
            <View style={styles.projectCard}>
              <Text style={styles.projectTitle}>{mission.project.title}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {mission.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{mission.notes}</Text>
          </View>
        )}

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Photos ({photos?.length || 0})
          </Text>
          {photos && photos.length > 0 ? (
            <PhotoGallery photos={photos} />
          ) : (
            <View style={styles.emptyPhotos}>
              <Text style={styles.emptyText}>No photos taken during this mission</Text>
            </View>
          )}
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
  mapContainer: {
    height: 200,
    backgroundColor: '#1a1a2e',
  },
  map: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
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
  projectCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4f46e5',
  },
  projectTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
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
  errorText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 48,
  },
});
