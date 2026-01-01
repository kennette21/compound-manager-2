import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import Mapbox, { Camera, MapView as MapboxMapView, UserLocation } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '../../src/stores/propertyStore';
import { useMissionStore } from '../../src/stores/missionStore';
import { useProjects } from '../../src/hooks/useProjects';
import { useStartMission } from '../../src/hooks/useMissions';
import { ProjectMarkers } from '../../src/components/map/ProjectMarkers';
import { ProjectPolygons } from '../../src/components/map/ProjectPolygons';
import { MissionTrack } from '../../src/components/map/MissionTrack';
import { MissionFAB } from '../../src/components/mission/MissionFAB';
import { DrawingManager, DrawingManagerHandle } from '../../src/components/map/DrawingManager';
import { StatusBadge } from '../../src/components/project/StatusBadge';
import type { Project } from '../../src/types';

type DrawingMode = 'point' | 'polygon' | 'polyline';

export default function MapScreen() {
  const mapRef = useRef<MapboxMapView>(null);
  const cameraRef = useRef<Camera>(null);
  const drawingRef = useRef<DrawingManagerHandle>(null);
  const { activeProperty } = usePropertyStore();
  const { activeMission, trackPoints, startMission } = useMissionStore();
  const { data: projects } = useProjects(activeProperty?.id);
  const startMissionMutation = useStartMission();

  const [locationPermission, setLocationPermission] = useState(false);

  // UI State
  const [mode, setMode] = useState<'view' | 'select-type' | 'drawing'>('view');
  const [drawingMode, setDrawingMode] = useState<DrawingMode | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectSheet, setShowProjectSheet] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
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
    } catch {
      Alert.alert('Error', 'Could not get your location');
    }
  }, [locationPermission]);

  const handleMapPress = useCallback((feature: GeoJSON.Feature) => {
    if (mode === 'drawing' && drawingMode && feature.geometry.type === 'Point') {
      const coords = feature.geometry.coordinates as [number, number];
      drawingRef.current?.addPoint(coords);
      // Update point count (for non-point modes)
      if (drawingMode !== 'point') {
        setPointCount(prev => prev + 1);
      }
    } else if (mode === 'view') {
      // Deselect when tapping empty area
      setSelectedProject(null);
      setShowProjectSheet(false);
    }
  }, [mode, drawingMode]);

  // Called when user taps on a project marker/polygon
  const handleProjectSelect = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowProjectSheet(true);
  }, []);

  // Start the "Add Project" flow
  const handleAddProject = () => {
    if (!activeProperty) {
      Alert.alert('No Property', 'Please select a property first in Settings');
      return;
    }
    setMode('select-type');
  };

  // User selected a geometry type
  const handleSelectGeometryType = (type: DrawingMode) => {
    setDrawingMode(type);
    setMode('drawing');
  };

  // Drawing completed - navigate to project form
  const handleFinishDrawing = (geometry: any) => {
    setMode('view');
    setDrawingMode(null);
    setPointCount(0);
    router.push({
      pathname: '/project/new',
      params: { geometry: JSON.stringify(geometry) },
    });
  };

  // Cancel drawing
  const handleCancelDrawing = () => {
    setMode('view');
    setDrawingMode(null);
    setPointCount(0);
  };

  // Undo last point
  const handleUndoPoint = () => {
    drawingRef.current?.undo();
    setPointCount(prev => Math.max(0, prev - 1));
  };

  // Confirm drawing and go to metadata
  const handleConfirmDrawing = () => {
    drawingRef.current?.finish();
  };

  // Check if can finish drawing
  const canFinishDrawing = () => {
    if (drawingMode === 'polygon') return pointCount >= 3;
    if (drawingMode === 'polyline') return pointCount >= 2;
    return false;
  };

  // Start mission for selected project
  const handleStartMissionForProject = async () => {
    if (!selectedProject || !activeProperty) return;

    try {
      const mission = await startMissionMutation.mutateAsync({
        property_id: activeProperty.id,
        project_id: selectedProject.id,
      });
      startMission(mission);
      setShowProjectSheet(false);
      router.push('/mission/active');
    } catch {
      Alert.alert('Error', 'Failed to start mission');
    }
  };

  // View project details
  const handleViewProject = () => {
    if (!selectedProject) return;
    setShowProjectSheet(false);
    router.push(`/project/${selectedProject.id}`);
  };

  const defaultCenter = activeProperty?.center_lng && activeProperty?.center_lat
    ? [activeProperty.center_lng, activeProperty.center_lat]
    : [-122.4194, 37.7749];

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

        {/* Project markers and polygons - disable selection during drawing */}
        {projects && (
          <>
            <ProjectMarkers
              projects={projects.filter(p => p.location)}
              onSelect={mode === 'view' ? handleProjectSelect : undefined}
              selectedId={selectedProject?.id}
            />
            <ProjectPolygons
              projects={projects.filter(p => p.area)}
              onSelect={mode === 'view' ? handleProjectSelect : undefined}
              selectedId={selectedProject?.id}
            />
          </>
        )}

        {/* Active mission track */}
        {activeMission && trackPoints.length > 0 && (
          <MissionTrack points={trackPoints} />
        )}

        {/* Drawing layers */}
        {mode === 'drawing' && drawingMode && (
          <DrawingManager
            ref={drawingRef}
            mode={drawingMode}
            onFinish={handleFinishDrawing}
          />
        )}
      </MapboxMapView>

      {/* Top right controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleCenterOnUser}>
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Drawing controls - same row */}
        {mode === 'drawing' && drawingMode && (
          <>
            <TouchableOpacity
              style={[styles.controlButton, styles.drawingButtonCancel]}
              onPress={handleCancelDrawing}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {pointCount > 0 && (
              <TouchableOpacity
                style={[styles.controlButton, styles.drawingButtonUndo]}
                onPress={handleUndoPoint}
              >
                <Ionicons name="arrow-undo" size={24} color="#fff" />
              </TouchableOpacity>
            )}

            {canFinishDrawing() && (
              <TouchableOpacity
                style={[styles.controlButton, styles.drawingButtonConfirm]}
                onPress={handleConfirmDrawing}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Add Project FAB - only in view mode */}
      {mode === 'view' && !activeMission && (
        <TouchableOpacity style={styles.addFab} onPress={handleAddProject}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Geometry Type Selection Modal */}
      <Modal
        visible={mode === 'select-type'}
        transparent
        animationType="fade"
        onRequestClose={() => setMode('view')}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMode('view')}>
          <View style={styles.typeSelectionCard}>
            <Text style={styles.typeSelectionTitle}>Select Location Type</Text>
            <Text style={styles.typeSelectionSubtitle}>
              How do you want to mark this project on the map?
            </Text>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => handleSelectGeometryType('point')}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons name="location" size={28} color="#4f46e5" />
              </View>
              <View style={styles.typeTextContainer}>
                <Text style={styles.typeOptionTitle}>Point</Text>
                <Text style={styles.typeOptionDesc}>A single location marker</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => handleSelectGeometryType('polyline')}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons name="trending-up" size={28} color="#4f46e5" />
              </View>
              <View style={styles.typeTextContainer}>
                <Text style={styles.typeOptionTitle}>Path / Line</Text>
                <Text style={styles.typeOptionDesc}>A trail, fence, or linear feature</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => handleSelectGeometryType('polygon')}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons name="shapes" size={28} color="#4f46e5" />
              </View>
              <View style={styles.typeTextContainer}>
                <Text style={styles.typeOptionTitle}>Area</Text>
                <Text style={styles.typeOptionDesc}>A zone, field, or bounded region</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelTypeButton}
              onPress={() => setMode('view')}
            >
              <Text style={styles.cancelTypeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Selected Project Bottom Sheet */}
      {showProjectSheet && selectedProject && (
        <View style={styles.projectSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {selectedProject.title}
              </Text>
              <StatusBadge status={selectedProject.status} />
            </View>
            {selectedProject.description && (
              <Text style={styles.sheetDescription} numberOfLines={2}>
                {selectedProject.description}
              </Text>
            )}
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.sheetActionButton}
              onPress={handleViewProject}
            >
              <Ionicons name="information-circle-outline" size={20} color="#4f46e5" />
              <Text style={styles.sheetActionText}>Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetActionButton, styles.sheetActionPrimary]}
              onPress={handleStartMissionForProject}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.sheetActionTextPrimary}>Start Mission</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sheetCloseButton}
            onPress={() => {
              setShowProjectSheet(false);
              setSelectedProject(null);
            }}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Mission FAB - only when mission is active */}
      {activeMission && <MissionFAB />}
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
  topControls: {
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
  addFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  typeSelectionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  typeSelectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeSelectionSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252542',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeOptionDesc: {
    color: '#888',
    fontSize: 13,
  },
  cancelTypeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelTypeText: {
    color: '#888',
    fontSize: 16,
  },
  // Project Sheet styles
  projectSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  sheetDescription: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252542',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  sheetActionPrimary: {
    backgroundColor: '#22c55e',
  },
  sheetActionText: {
    color: '#4f46e5',
    fontSize: 15,
    fontWeight: '600',
  },
  sheetActionTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sheetCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Drawing button colors
  drawingButtonCancel: {
    backgroundColor: '#ef4444',
  },
  drawingButtonUndo: {
    backgroundColor: '#f59e0b',
  },
  drawingButtonConfirm: {
    backgroundColor: '#22c55e',
  },
});
