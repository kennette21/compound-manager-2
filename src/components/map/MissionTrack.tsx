import { ShapeSource, LineLayer, CircleLayer } from '@rnmapbox/maps';
import type { LocationCoords } from '../../types';

interface MissionTrackProps {
  points: LocationCoords[];
  color?: string;
  showPoints?: boolean;
}

export function MissionTrack({
  points,
  color = '#22c55e',
  showPoints = false,
}: MissionTrackProps) {
  if (points.length < 2) return null;

  const lineGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: points.map((p) => [p.longitude, p.latitude]),
    },
  };

  const pointsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: points.map((point, index) => ({
      type: 'Feature' as const,
      properties: {
        index,
        isStart: index === 0,
        isEnd: index === points.length - 1,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };

  return (
    <>
      {/* Track line */}
      <ShapeSource id="mission-track-line" shape={lineGeoJSON}>
        <LineLayer
          id="mission-track-layer"
          style={{
            lineColor: color,
            lineWidth: 4,
            lineOpacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
        {/* Outline for better visibility */}
        <LineLayer
          id="mission-track-outline"
          belowLayerID="mission-track-layer"
          style={{
            lineColor: '#000',
            lineWidth: 6,
            lineOpacity: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      </ShapeSource>

      {/* Start and end markers */}
      <ShapeSource id="mission-track-points" shape={pointsGeoJSON}>
        {/* Start point - green */}
        <CircleLayer
          id="mission-start-point"
          filter={['==', ['get', 'isStart'], true]}
          style={{
            circleRadius: 8,
            circleColor: '#22c55e',
            circleStrokeColor: '#fff',
            circleStrokeWidth: 2,
          }}
        />
        {/* End point - red */}
        <CircleLayer
          id="mission-end-point"
          filter={['==', ['get', 'isEnd'], true]}
          style={{
            circleRadius: 8,
            circleColor: '#ef4444',
            circleStrokeColor: '#fff',
            circleStrokeWidth: 2,
          }}
        />
        {/* Intermediate points (optional) */}
        {showPoints && (
          <CircleLayer
            id="mission-intermediate-points"
            filter={[
              'all',
              ['!=', ['get', 'isStart'], true],
              ['!=', ['get', 'isEnd'], true],
            ]}
            style={{
              circleRadius: 3,
              circleColor: color,
              circleOpacity: 0.5,
            }}
          />
        )}
      </ShapeSource>
    </>
  );
}
