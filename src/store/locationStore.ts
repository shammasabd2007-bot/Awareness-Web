import { create } from 'zustand';
import {
  getAllLocations,
  getLocationsByStatus,
  insertLocation,
  updateLocationStatus,
  getLocationsByUser,
  insertVisitHistory,
  getVisitHistory,
  addToSyncQueue,
  updateUserPoints,
  getUserById,
} from '../database/db.web';

// Simple UUID generator
const generateId = () => {
  return 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Points rules:
 *  admin     → 0  (admins never earn points)
 *  user      → 50 for marking a location
 *  volunteer → 30 for marking | 30 for in_progress | 50 for completed
 */
const POINTS = {
  user: {
    mark: 50,
  },
  volunteer: {
    mark:        30,
    in_progress: 30,
    completed:   50,
  },
} as const;

/**
 * Returns how many points to award for a given action + role.
 * Returns 0 for admin or any unrecognised combination.
 */
const calcPoints = (
  role: string,
  action: 'mark' | 'in_progress' | 'completed'
): number => {
  if (role === 'admin') return 0;
  if (role === 'user'      && action === 'mark')        return POINTS.user.mark;
  if (role === 'volunteer' && action === 'mark')        return POINTS.volunteer.mark;
  if (role === 'volunteer' && action === 'in_progress') return POINTS.volunteer.in_progress;
  if (role === 'volunteer' && action === 'completed')   return POINTS.volunteer.completed;
  return 0;
};

export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: string;
  status: 'not_visited' | 'in_progress' | 'completed';
  images: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitRecord {
  id: string;
  locationId: string;
  volunteerId: string;
  status: string;
  notes: string;
  images: string[];
  timestamp: string;
}

interface LocationStore {
  locations: Location[];
  selectedLocation: Location | null;
  visitHistory: VisitRecord[];
  isLoading: boolean;

  // Fetch operations
  fetchAllLocations: () => Promise<void>;
  fetchLocationsByStatus: (status: string) => Promise<void>;
  fetchLocationsByUser: (userId: string) => Promise<void>;
  fetchVisitHistory: (locationId: string) => Promise<void>;

  // Create/Update operations
  addLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStatus: (locationId: string, status: string, userId: string) => Promise<void>;
  addVisitRecord: (
    locationId: string,
    volunteerId: string,
    status: string,
    notes: string,
    images: string[]
  ) => Promise<void>;

  // UI state
  setSelectedLocation: (location: Location | null) => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: [],
  selectedLocation: null,
  visitHistory: [],
  isLoading: false,

  fetchAllLocations: async () => {
    set({ isLoading: true });
    try {
      const locations = await getAllLocations();
      set({ locations: locations as Location[] });
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLocationsByStatus: async (status: string) => {
    set({ isLoading: true });
    try {
      const locations = await getLocationsByStatus(status);
      set({ locations: locations as Location[] });
    } catch (error) {
      console.error('Error fetching locations by status:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLocationsByUser: async (userId: string) => {
    set({ isLoading: true });
    try {
      const locations = await getLocationsByUser(userId);
      set({ locations: locations as Location[] });
    } catch (error) {
      console.error('Error fetching user locations:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchVisitHistory: async (locationId: string) => {
    try {
      const history = await getVisitHistory(locationId);
      set({ visitHistory: history as VisitRecord[] });
    } catch (error) {
      console.error('Error fetching visit history:', error);
    }
  },

  addLocation: async (location) => {
    try {
      const id = generateId();
      const newLocation = {
        ...location,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await insertLocation(newLocation);
      await addToSyncQueue('INSERT', 'locations', newLocation);

      set((state) => ({
        locations: [newLocation as Location, ...state.locations],
      }));

      // Award points based on role — admin gets 0
      const actor = await getUserById(location.userId);
      const pts = calcPoints(actor?.role ?? 'user', 'mark');
      if (pts > 0) await updateUserPoints(location.userId, pts);
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  },

  updateStatus: async (locationId: string, status: string, userId: string) => {
    try {
      await updateLocationStatus(locationId, status);
      await addToSyncQueue('UPDATE', 'locations', { id: locationId, status });

      // Award points based on role — admin gets 0
      const actor = await getUserById(userId);
      const action = status === 'completed' ? 'completed'
                   : status === 'in_progress' ? 'in_progress'
                   : 'mark';
      const pts = calcPoints(actor?.role ?? 'volunteer', action as any);
      if (pts > 0) await updateUserPoints(userId, pts);

      set((state) => ({
        locations: state.locations.map((loc) =>
          loc.id === locationId ? { ...loc, status: status as any } : loc
        ),
      }));
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  addVisitRecord: async (
    locationId: string,
    volunteerId: string,
    status: string,
    notes: string,
    images: string[]
  ) => {
    try {
      const id = generateId();
      const visitRecord = {
        id,
        locationId,
        volunteerId,
        status,
        notes,
        images,
        timestamp: new Date().toISOString(),
      };

      await insertVisitHistory(visitRecord);

      // Add to sync queue
      await addToSyncQueue('INSERT', 'visit_history', visitRecord);

      // Update location status
      await get().updateStatus(locationId, status, volunteerId);

      // Fetch updated history
      await get().fetchVisitHistory(locationId);
    } catch (error) {
      console.error('Error adding visit record:', error);
      throw error;
    }
  },

  setSelectedLocation: (location) => {
    set({ selectedLocation: location });
  },
}));
