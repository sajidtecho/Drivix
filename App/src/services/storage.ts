import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'drivix_auth_token';

export const storage = {
  /**
   * Securely save the JWT authorization token.
   */
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  },

  /**
   * Retrieve the stored JWT authorization token.
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  /**
   * Remove the stored JWT authorization token.
   */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  },

  /**
   * Save any serializable item to storage.
   */
  async saveItem(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error saving item [${key}]:`, error);
    }
  },

  /**
   * Retrieve a parsed item from storage.
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Error getting item [${key}]:`, error);
      return null;
    }
  },

  /**
   * Remove a specific item from storage.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item [${key}]:`, error);
    }
  },
};
