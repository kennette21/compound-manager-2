import { ShapeSource, FillLayer, LineLayer } from '@rnmapbox/maps';
import type { Project } from '../../types';

interface ProjectPolygonsProps {
  projects: Project[];
  onSelect?: (project: Project) => void;
  selectedId?: string;
}

const STATUS_COLORS = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  completed: '#22c55e',
};

export function ProjectPolygons({ projects, onSelect, selectedId }: ProjectPolygonsProps) {
  // Create a map of project id to project for quick lookup
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Convert projects to GeoJSON FeatureCollection
  const featureCollection = {
    type: 'FeatureCollection' as const,
    features: projects
      .filter((p) => p.area)
      .map((project) => {
        const isSelected = project.id === selectedId;
        return {
          type: 'Feature' as const,
          id: project.id,
          properties: {
            id: project.id,
            title: project.title,
            status: project.status,
            color: project.category?.color || STATUS_COLORS[project.status],
            fillOpacity: isSelected ? 0.5 : project.status === 'completed' ? 0.3 : 0.4,
            lineWidth: isSelected ? 4 : 2,
          },
          geometry: project.area!,
        };
      }),
  };

  const polygons = featureCollection.features.filter(
    (f) => f.geometry.type === 'Polygon'
  );

  const lines = featureCollection.features.filter(
    (f) => f.geometry.type === 'LineString'
  );

  const handlePress = (e: any) => {
    const feature = e.features?.[0];
    if (feature?.properties?.id) {
      const project = projectMap.get(feature.properties.id);
      if (project && onSelect) {
        onSelect(project);
      }
    }
  };

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
          onPress={handlePress}
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
              lineWidth: ['get', 'lineWidth'],
              lineOpacity: 0.9,
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
          onPress={handlePress}
        >
          <LineLayer
            id="project-line"
            style={{
              lineColor: ['get', 'color'],
              lineWidth: ['get', 'lineWidth'],
              lineOpacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      )}
    </>
  );
}
