import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShapeSource, CircleLayer, LineLayer, FillLayer } from '@rnmapbox/maps';
import type { GeoJSONPoint, GeoJSONPolygon, GeoJSONLineString } from '../../types';

interface DrawingManagerProps {
  mode: 'point' | 'polygon' | 'polyline';
  onFinish: (geometry: GeoJSONPoint | GeoJSONPolygon | GeoJSONLineString) => void;
  onCancel: () => void;
}

export function DrawingManager({ mode, onFinish, onCancel }: DrawingManagerProps) {
  const [points, setPoints] = useState<[number, number][]>([]);

  const handleMapPress = useCallback(
    (coordinates: [number, number]) => {
      if (mode === 'point') {
        // For point mode, immediately finish with the tapped location
        onFinish({
          type: 'Point',
          coordinates,
        });
      } else {
        // For polygon/polyline, add point to the collection
        setPoints((prev) => [...prev, coordinates]);
      }
    },
    [mode, onFinish]
  );

  const handleUndo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleFinish = useCallback(() => {
    if (mode === 'polygon' && points.length >= 3) {
      // Close the polygon by adding the first point at the end
      const closedPoints = [...points, points[0]];
      onFinish({
        type: 'Polygon',
        coordinates: [closedPoints],
      });
    } else if (mode === 'polyline' && points.length >= 2) {
      onFinish({
        type: 'LineString',
        coordinates: points,
      });
    }
  }, [mode, points, onFinish]);

  // Create GeoJSON for visualization
  const pointsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: points.map((coord, index) => ({
      type: 'Feature' as const,
      properties: { index },
      geometry: {
        type: 'Point' as const,
        coordinates: coord,
      },
    })),
  };

  const lineGeoJSON =
    points.length >= 2
      ? {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: mode === 'polygon' ? [...points, points[0]] : points,
          },
        }
      : null;

  const polygonGeoJSON =
    mode === 'polygon' && points.length >= 3
      ? {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[...points, points[0]]],
          },
        }
      : null;

  const canFinish =
    (mode === 'polygon' && points.length >= 3) ||
    (mode === 'polyline' && points.length >= 2);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Drawing visualization layers */}
      {polygonGeoJSON && (
        <ShapeSource id="drawing-polygon" shape={polygonGeoJSON}>
          <FillLayer
            id="drawing-polygon-fill"
            style={{
              fillColor: '#4f46e5',
              fillOpacity: 0.3,
            }}
          />
        </ShapeSource>
      )}

      {lineGeoJSON && (
        <ShapeSource id="drawing-line" shape={lineGeoJSON}>
          <LineLayer
            id="drawing-line-layer"
            style={{
              lineColor: '#4f46e5',
              lineWidth: 3,
              lineDasharray: [2, 2],
            }}
          />
        </ShapeSource>
      )}

      {points.length > 0 && (
        <ShapeSource id="drawing-points" shape={pointsGeoJSON}>
          <CircleLayer
            id="drawing-points-layer"
            style={{
              circleRadius: 8,
              circleColor: '#4f46e5',
              circleStrokeColor: '#fff',
              circleStrokeWidth: 2,
            }}
          />
        </ShapeSource>
      )}

      {/* Drawing controls */}
      <View style={styles.controls}>
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {mode === 'point'
              ? 'Tap to place a point'
              : mode === 'polygon'
                ? `Tap to add points (${points.length}/3+ required)`
                : `Tap to add points (${points.length}/2+ required)`}
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          {points.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.undoButton]}
              onPress={handleUndo}
            >
              <Text style={styles.buttonText}>Undo</Text>
            </TouchableOpacity>
          )}

          {canFinish && (
            <TouchableOpacity
              style={[styles.button, styles.finishButton]}
              onPress={handleFinish}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    gap: 12,
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  undoButton: {
    backgroundColor: '#f59e0b',
  },
  finishButton: {
    backgroundColor: '#4f46e5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
