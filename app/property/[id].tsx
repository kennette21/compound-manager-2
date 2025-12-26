import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Mapbox, { Camera, MapView as MapboxMapView, ShapeSource, FillLayer, LineLayer } from '@rnmapbox/maps';
import { supabase } from '../../src/lib/supabase';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import type { Property } from '../../src/types';

function useProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: async (): Promise<Property | null> => {
      if (!propertyId) return null;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapboxMapView>(null);
  const { data: property, isLoading, refetch, isRefetching } = useProperty(id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!property) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  const centerCoord =
    property.center_lng && property.center_lat
      ? [property.center_lng, property.center_lat]
      : [-122.4194, 37.7749];

  return (
    <>
      <Stack.Screen
        options={{
          title: property.name,
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
                zoomLevel: 13,
              }}
            />
            {property.boundary && (
              <ShapeSource
                id="property-boundary"
                shape={{
                  type: 'Feature',
                  properties: {},
                  geometry: property.boundary,
                }}
              >
                <FillLayer
                  id="property-boundary-fill"
                  style={{
                    fillColor: '#4f46e5',
                    fillOpacity: 0.2,
                  }}
                />
                <LineLayer
                  id="property-boundary-line"
                  style={{
                    lineColor: '#4f46e5',
                    lineWidth: 3,
                  }}
                />
              </ShapeSource>
            )}
          </MapboxMapView>
        </View>

        {/* Property Info */}
        <View style={styles.content}>
          <Text style={styles.name}>{property.name}</Text>

          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(property.created_at).toLocaleDateString()}
                </Text>
              </View>
              {property.center_lat && property.center_lng && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Center</Text>
                  <Text style={styles.detailValue}>
                    {property.center_lat.toFixed(4)}, {property.center_lng.toFixed(4)}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Boundary</Text>
                <Text style={styles.detailValue}>
                  {property.boundary ? 'Defined' : 'Not set'}
                </Text>
              </View>
            </View>
          </View>
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
    height: 250,
    backgroundColor: '#1a1a2e',
  },
  map: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
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
  errorText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 48,
  },
});
