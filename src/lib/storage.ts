import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase, getStorageUrl } from './supabase';
import type { LocationCoords, GeoJSONPoint } from '../types';

interface PhotoCaptureResult {
  uri: string;
  width: number;
  height: number;
  location: LocationCoords | null;
}

// Request camera permissions
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

// Request photo library permissions
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

// Capture a photo with camera
export async function capturePhoto(): Promise<PhotoCaptureResult | null> {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return null;
    }

    // Get current location
    let location: LocationCoords | null = null;
    const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
    if (locationStatus === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        location = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? undefined,
          altitude: loc.coords.altitude ?? undefined,
          timestamp: loc.timestamp,
        };
      } catch {
        // Location unavailable, continue without it
      }
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      exif: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      location,
    };
  } catch (error) {
    console.error('Error capturing photo:', error);
    return null;
  }
}

// Pick photo from library
export async function pickPhoto(): Promise<PhotoCaptureResult | null> {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      exif: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];

    // Try to extract location from EXIF
    let location: LocationCoords | null = null;
    if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
      location = {
        latitude: asset.exif.GPSLatitude,
        longitude: asset.exif.GPSLongitude,
        timestamp: Date.now(),
      };
    }

    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      location,
    };
  } catch (error) {
    console.error('Error picking photo:', error);
    return null;
  }
}

// Convert URI to Blob for upload
export async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return await response.blob();
}

// Upload photo to Supabase Storage
export async function uploadPhoto(
  uri: string,
  folder: string,
  fileName?: string
): Promise<{ path: string; url: string } | null> {
  try {
    const blob = await uriToBlob(uri);
    const timestamp = Date.now();
    const name = fileName || `photo-${timestamp}.jpg`;
    const path = `${folder}/${name}`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    return {
      path,
      url: getStorageUrl('photos', path),
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
}

// Convert LocationCoords to GeoJSON Point
export function coordsToGeoJSON(coords: LocationCoords): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [coords.longitude, coords.latitude],
  };
}

// Delete photo from storage
export async function deletePhoto(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from('photos').remove([path]);
    return !error;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
}

interface CaptureAndUploadOptions {
  missionId?: string;
  projectId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface CaptureAndUploadResult {
  storagePath: string;
  thumbnailPath?: string;
  url: string;
  location: LocationCoords | null;
}

// Capture photo and upload in one operation
export async function captureAndUploadPhoto(
  options: CaptureAndUploadOptions
): Promise<CaptureAndUploadResult | null> {
  try {
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      exif: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    const timestamp = Date.now();
    const folder = options.missionId
      ? `missions/${options.missionId}`
      : options.projectId
        ? `projects/${options.projectId}`
        : 'general';
    const fileName = `photo-${timestamp}.jpg`;
    const path = `${folder}/${fileName}`;

    // Convert to blob and upload
    const blob = await uriToBlob(asset.uri);
    const { error } = await supabase.storage.from('photos').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Build location from options or EXIF
    let location: LocationCoords | null = null;
    if (options.location) {
      location = {
        latitude: options.location.latitude,
        longitude: options.location.longitude,
        timestamp,
      };
    } else if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
      location = {
        latitude: asset.exif.GPSLatitude,
        longitude: asset.exif.GPSLongitude,
        timestamp,
      };
    }

    return {
      storagePath: path,
      url: getStorageUrl('photos', path),
      location,
    };
  } catch (error) {
    console.error('Error in captureAndUploadPhoto:', error);
    return null;
  }
}
