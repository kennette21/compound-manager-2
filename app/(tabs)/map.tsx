import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import Mapbox, { Camera, MapView as MapboxMapView, UserLocation } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { usePropertyStore } from '../../src/stores/propertyStore';
import { useMissionStore } from '../../src/stores/missionStore';
import { useProjects } from '../../src/hooks/useProjects';
import { ProjectMarkers } from '../../src/components/map/ProjectMarkers';
import { ProjectPolygons } from '../../src/components/map/ProjectPolygons';
import { MissionTrack } from '../../src/components/map/MissionTrack';
import { MissionFAB } from '../../src/components/mission/MissionFAB';
import { DrawingManager } from '../../src/components/map/DrawingManager';

export default function MapScreen() {
  const mapRef = useRef<MapboxMapView>(null);
  const cameraRef = useRef<Camera>(null);
  const { activeProperty } = usePropertyStore();
  const { activeMission, trackPoints } = useMissionStore();
  const { data: projects } = useProjects(activeProperty?.id);

  const [locationPermission, setLocationPermission] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'point' | 'polygon' | 'polyline' | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Location Permission',
        'Location permission is needed to show your position on the map.'
      );
    }
  };

  const handleCenterOnUser = useCallback(async () => {
    if (!locationPermission) {
      await requestLocationPermission();
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      cameraRef.current?.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: 16,
        animationDuration: 1000,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    }
  }, [locationPermission]);

  const handleMapPress = useCallback((feature: GeoJSON.Feature) => {
    if (isDrawing && drawingMode) {
      // Drawing mode is handled by DrawingManager
      return;
    }
  }, [isDrawing, drawingMode]);

  const handleStartDrawing = (mode: 'point' | 'polygon' | 'polyline') => {
    setDrawingMode(mode);
    setIsDrawing(true);
  };

  const handleFinishDrawing = (geometry: any) => {
    setIsDrawing(false);
    setDrawingMode(null);

    // Navigate to create project with the geometry
    router.push({
      pathname: '/project/new',
      params: { geometry: JSON.stringify(geometry) },
    });
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setDrawingMode(null);
  };

  // Default center (can be overridden by property center)
  const defaultCenter = activeProperty?.center_lng && activeProperty?.center_lat
    ? [activeProperty.center_lng, activeProperty.center_lat]
    : [-122.4194, 37.7749]; // San Francisco default

  return (
    <View style={styles.container}>
      <MapboxMapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.SatelliteStreet}
        onPress={handleMapPress}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: defaultCenter,
            zoomLevel: 14,
          }}
        />

        {locationPermission && <UserLocation visible={true} />}

        {/* Project markers and polygons */}
        {projects && (
          <>
            <ProjectMarkers projects={projects.filter(p => p.location)} />
            <ProjectPolygons projects={projects.filter(p => p.area)} />
          </>
        )}

        {/* Active mission track */}
        {activeMission && trackPoints.length > 0 && (
          <MissionTrack points={trackPoints} />
        )}

        {/* Drawing overlay */}
        {isDrawing && drawingMode && (
          <DrawingManager
            mode={drawingMode}
            onFinish={handleFinishDrawing}
            onCancel={handleCancelDrawing}
          />
        )}
      </MapboxMapView>

      {/* Map controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCenterOnUser}
        >
          <Text style={styles.controlIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Drawing mode controls */}
      {!isDrawing && (
        <View style={styles.drawingControls}>
          <TouchableOpacity
            style={styles.drawButton}
            onPress={() => handleStartDrawing('point')}
          >
            <Text style={styles.drawButtonText}>Point</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawButton}
            onPress={() => handleStartDrawing('polygon')}
          >
            <Text style={styles.drawButtonText}>Area</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawButton}
            onPress={() => handleStartDrawing('polyline')}
          >
            <Text style={styles.drawButtonText}>Path</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mission FAB */}
      <MissionFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  drawingControls: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  drawButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  drawButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
