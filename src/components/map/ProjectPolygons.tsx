import { useCallback } from 'react';
import { ShapeSource, FillLayer, LineLayer, SymbolLayer } from '@rnmapbox/maps';
import { router } from 'expo-router';
import type { Project, GeoJSONPolygon, GeoJSONLineString } from '../../types';

interface ProjectPolygonsProps {
  projects: Project[];
}

const STATUS_COLORS = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  completed: '#22c55e',
};

export function ProjectPolygons({ projects }: ProjectPolygonsProps) {
  // Convert projects to GeoJSON FeatureCollection
  const featureCollection = {
    type: 'FeatureCollection' as const,
    features: projects
      .filter((p) => p.area)
      .map((project) => ({
        type: 'Feature' as const,
        id: project.id,
        properties: {
          id: project.id,
          title: project.title,
          status: project.status,
          color: project.category?.color || STATUS_COLORS[project.status],
          fillOpacity: project.status === 'completed' ? 0.3 : 0.4,
        },
        geometry: project.area!,
      })),
  };

  const polygons = featureCollection.features.filter(
    (f) => f.geometry.type === 'Polygon'
  );

  const lines = featureCollection.features.filter(
    (f) => f.geometry.type === 'LineString'
  );

  return (
    <>
      {/* Polygon fills */}
      {polygons.length > 0 && (
        <ShapeSource
          id="project-polygons"
          shape={{
            type: 'FeatureCollection',
            features: polygons,
          }}
          onPress={(e) => {
            const feature = e.features?.[0];
            if (feature?.properties?.id) {
              router.push(`/project/${feature.properties.id}`);
            }
          }}
        >
          <FillLayer
            id="project-polygon-fill"
            style={{
              fillColor: ['get', 'color'],
              fillOpacity: ['get', 'fillOpacity'],
            }}
          />
          <LineLayer
            id="project-polygon-outline"
            style={{
              lineColor: ['get', 'color'],
              lineWidth: 2,
              lineOpacity: 0.8,
            }}
          />
        </ShapeSource>
      )}

      {/* Polylines */}
      {lines.length > 0 && (
        <ShapeSource
          id="project-lines"
          shape={{
            type: 'FeatureCollection',
            features: lines,
          }}
          onPress={(e) => {
            const feature = e.features?.[0];
            if (feature?.properties?.id) {
              router.push(`/project/${feature.properties.id}`);
            }
          }}
        >
          <LineLayer
            id="project-line"
            style={{
              lineColor: ['get', 'color'],
              lineWidth: 4,
              lineOpacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      )}
    </>
  );
}
