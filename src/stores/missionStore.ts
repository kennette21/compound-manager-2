import { create } from 'zustand';
import type { Mission, LocationCoords } from '../types';

interface MissionState {
  activeMission: Mission | null;
  trackPoints: LocationCoords[];
  startTime: number | null;
  elapsedSeconds: number;
  distance: number;

  startMission: (mission: Mission) => void;
  endMission: () => void;
  cancelMission: () => void;
  addTrackPoint: (point: LocationCoords) => void;
  updateElapsed: (seconds: number) => void;
  updateDistance: (meters: number) => void;
  clear: () => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  activeMission: null,
  trackPoints: [],
  startTime: null,
  elapsedSeconds: 0,
  distance: 0,

  startMission: (mission) =>
    set({
      activeMission: mission,
      trackPoints: [],
      startTime: Date.now(),
      elapsedSeconds: 0,
      distance: 0,
    }),

  endMission: () =>
    set({
      activeMission: null,
      startTime: null,
    }),

  cancelMission: () =>
    set({
      activeMission: null,
      trackPoints: [],
      startTime: null,
      elapsedSeconds: 0,
      distance: 0,
    }),

  addTrackPoint: (point) =>
    set((state) => {
      const newPoints = [...state.trackPoints, point];

      // Calculate distance from last point
      if (state.trackPoints.length > 0) {
        const lastPoint = state.trackPoints[state.trackPoints.length - 1];
        const additionalDistance = calculateDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          point.latitude,
          point.longitude
        );
        return {
          trackPoints: newPoints,
          distance: state.distance + additionalDistance,
        };
      }

      return { trackPoints: newPoints };
    }),

  updateElapsed: (seconds) => set({ elapsedSeconds: seconds }),

  updateDistance: (meters) => set({ distance: meters }),

  clear: () =>
    set({
      activeMission: null,
      trackPoints: [],
      startTime: null,
      elapsedSeconds: 0,
      distance: 0,
    }),
}));

// Haversine formula for distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
