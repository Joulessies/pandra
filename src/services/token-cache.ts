import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TokenCache } from '@clerk/expo';

const memoryStore: Record<string, string> = {};

export const tokenCache: TokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined'
          ? localStorage.getItem(key)
          : memoryStore[key] || null;
      }
      const item = await SecureStore.getItemAsync(key);
      return item ?? memoryStore[key] ?? null;
    } catch (error) {
      console.warn('[TokenCache] Failed to get token:', error);
      return memoryStore[key] || null;
    }
  },

  async saveToken(key: string, value: string): Promise<void> {
    try {
      memoryStore[key] = value;
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('[TokenCache] Failed to save token:', err);
    }
  },

  async clearToken(key: string): Promise<void> {
    try {
      delete memoryStore[key];
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('[TokenCache] Failed to clear token:', err);
    }
  },
};
