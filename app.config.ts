import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Compound Manager',
  slug: 'compound-manager',
  owner: 'kennette21',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'compound-manager',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1a1a2e',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.compoundmanager.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'We need your location to show your position on the map and geotag photos.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'We need your location to track your work missions even when the app is in the background.',
      NSLocationAlwaysUsageDescription:
        'We need your location to track your work missions even when the app is in the background.',
      NSCameraUsageDescription:
        'We need camera access to take photos of your work projects.',
      NSPhotoLibraryUsageDescription:
        'We need photo library access to select photos for your projects.',
      UIBackgroundModes: ['location', 'fetch'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1a1a2e',
    },
    package: 'com.compoundmanager.app',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    '@rnmapbox/maps',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow Compound Manager to track your work missions.',
        locationAlwaysPermission:
          'Allow Compound Manager to track your work missions.',
        locationWhenInUsePermission:
          'Allow Compound Manager to show your location on the map.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Compound Manager to access your photos.',
        cameraPermission: 'Allow Compound Manager to take photos.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow Compound Manager to access your camera.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: 'e1259f53-6307-4fc4-9afa-79ff4008c8ba',
    },
  },
});
