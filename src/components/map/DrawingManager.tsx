import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ShapeSource, CircleLayer, LineLayer, FillLayer } from '@rnmapbox/maps';
import type { GeoJSONPoint, GeoJSONPolygon, GeoJSONLineString } from '../../types';

interface DrawingManagerProps {
  mode: 'point' | 'polygon' | 'polyline';
  onFinish: (geometry: GeoJSONPoint | GeoJSONPolygon | GeoJSONLineString) => void;
}

export interface DrawingManagerHandle {
  addPoint: (coordinates: [number, number]) => void;
  undo: () => void;
  finish: () => void;
  getPointCount: () => number;
  canFinish: () => boolean;
}

export const DrawingManager = forwardRef<DrawingManagerHandle, DrawingManagerProps>(
  function DrawingManagerComponent({ mode, onFinish }, ref) {
    const [points, setPoints] = useState<[number, number][]>([]);

    const addPoint = useCallback(
      (coordinates: [number, number]) => {
        if (mode === 'point') {
          onFinish({
            type: 'Point',
            coordinates,
          });
        } else {
          setPoints((prev) => [...prev, coordinates]);
        }
      },
      [mode, onFinish]
    );

    const undo = useCallback(() => {
      setPoints((prev) => prev.slice(0, -1));
    }, []);

    const finish = useCallback(() => {
      if (mode === 'polygon' && points.length >= 3) {
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

    const getPointCount = useCallback(() => points.length, [points]);

    const canFinish = useCallback(() => {
      return (
        (mode === 'polygon' && points.length >= 3) ||
        (mode === 'polyline' && points.length >= 2)
      );
    }, [mode, points]);

    useImperativeHandle(ref, () => ({
      addPoint,
      undo,
      finish,
      getPointCount,
      canFinish,
    }), [addPoint, undo, finish, getPointCount, canFinish]);

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

    // Only render the map layers - no UI here
    return (
      <>
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
                circleRadius: 10,
                circleColor: '#4f46e5',
                circleStrokeColor: '#fff',
                circleStrokeWidth: 3,
              }}
            />
          </ShapeSource>
        )}
      </>
    );
  }
);
