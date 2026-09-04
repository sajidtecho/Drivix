import { storage } from './storage';
import { Booking } from '@/types/booking';
import { UserDocument, RegisteredVehicle } from '@/types/user';

const ACTIVE_PASS_KEY = 'drivix_offline_active_pass';
const CACHED_DOCS_KEY = 'drivix_offline_cached_documents';
const CACHED_VEHICLES_KEY = 'drivix_offline_cached_vehicles';

export interface CachedPassData {
  booking: Booking;
  selectedLocationName?: string;
  selectedSlotNumber?: string;
  qrCodeToken: string;
  cachedAt: string;
}

export const offlineStorage = {
  /**
   * Save active booking pass details locally for offline basement access.
   */
  async saveActivePass(data: CachedPassData): Promise<void> {
    try {
      await storage.saveItem(ACTIVE_PASS_KEY, data);
      console.log('⚡ Offline Storage: Active pass token cached for basement access');
    } catch (err) {
      console.warn('Error saving offline pass:', err);
    }
  },

  /**
   * Get cached active booking pass for offline basement access.
   */
  async getActivePass(): Promise<CachedPassData | null> {
    try {
      return await storage.getItem<CachedPassData>(ACTIVE_PASS_KEY);
    } catch (err) {
      console.warn('Error reading cached offline pass:', err);
      return null;
    }
  },

  /**
   * Clear active pass when completed / checked out.
   */
  async clearActivePass(): Promise<void> {
    try {
      await storage.removeItem(ACTIVE_PASS_KEY);
    } catch (err) {
      console.warn('Error clearing offline pass:', err);
    }
  },

  /**
   * Cache user identity documents (DL, PUC, RC).
   */
  async saveUserDocuments(documents: UserDocument[]): Promise<void> {
    try {
      await storage.saveItem(CACHED_DOCS_KEY, documents);
    } catch (err) {
      console.warn('Error saving offline documents:', err);
    }
  },

  /**
   * Get cached user identity documents.
   */
  async getUserDocuments(): Promise<UserDocument[]> {
    try {
      const docs = await storage.getItem<UserDocument[]>(CACHED_DOCS_KEY);
      return docs || [];
    } catch (err) {
      console.warn('Error reading offline documents:', err);
      return [];
    }
  },

  /**
   * Cache user registered vehicles.
   */
  async saveUserVehicles(vehicles: RegisteredVehicle[]): Promise<void> {
    try {
      await storage.saveItem(CACHED_VEHICLES_KEY, vehicles);
    } catch (err) {
      console.warn('Error saving offline vehicles:', err);
    }
  },

  /**
   * Get cached user registered vehicles.
   */
  async getUserVehicles(): Promise<RegisteredVehicle[]> {
    try {
      const list = await storage.getItem<RegisteredVehicle[]>(CACHED_VEHICLES_KEY);
      return list || [];
    } catch (err) {
      console.warn('Error reading offline vehicles:', err);
      return [];
    }
  },
};

export default offlineStorage;
