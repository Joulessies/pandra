import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth, useUser } from '@clerk/expo';
import { ADMIN_CREDENTIALS } from '@/services/widget-storage';

const ADMIN_SESSION_KEY = 'pandra_local_admin_active';

let globalAdminActive = false;

// Safe dynamic AsyncStorage loader
let AsyncStorageModule: any = null;
try {
  AsyncStorageModule =
    require('@react-native-async-storage/async-storage').default ||
    require('@react-native-async-storage/async-storage');
} catch {
  AsyncStorageModule = null;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthContextType {
  isLoaded: boolean;
  isAuthenticated: boolean;
  isLocalAdmin: boolean;
  user: AppUser | null;
  clerkUser: any;
  loginAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoaded: false,
  isAuthenticated: false,
  isLocalAdmin: false,
  user: null,
  clerkUser: null,
  loginAsAdmin: async () => {},
  logout: async () => {},
});

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, signOut: clerkSignOut } = useAuth();
  const { user: clerkUser } = useUser();

  const [isLocalAdmin, setIsLocalAdmin] = useState(globalAdminActive);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // 1. Load initial local admin session state
  useEffect(() => {
    let isMounted = true;
    async function loadAdminSession() {
      try {
        let val: string | null = null;

        if (Platform.OS !== 'web') {
          try {
            val = await SecureStore.getItemAsync(ADMIN_SESSION_KEY);
          } catch {}
        }

        if (!val && AsyncStorageModule?.getItem) {
          try {
            val = await AsyncStorageModule.getItem(ADMIN_SESSION_KEY);
          } catch {}
        }

        if (!val && typeof localStorage !== 'undefined') {
          val = localStorage.getItem(ADMIN_SESSION_KEY);
        }

        if (val === 'true') {
          globalAdminActive = true;
          if (isMounted) {
            setIsLocalAdmin(true);
          }
        }
      } catch (err) {
        console.warn('[Auth] Failed to load local admin session:', err);
      } finally {
        if (isMounted) {
          setIsStorageLoaded(true);
        }
      }
    }

    loadAdminSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Login as Admin (Synchronous flag + Multi-tier persistence)
  const loginAsAdmin = useCallback(async () => {
    globalAdminActive = true;
    setIsLocalAdmin(true);

    try {
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.setItemAsync(ADMIN_SESSION_KEY, 'true');
        } catch {}
      }
      if (AsyncStorageModule?.setItem) {
        try {
          await AsyncStorageModule.setItem(ADMIN_SESSION_KEY, 'true');
        } catch {}
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      }
    } catch (err) {
      console.error('[Auth] Failed to persist admin login:', err);
    }
  }, []);

  // 3. Logout handler
  const logout = useCallback(async () => {
    globalAdminActive = false;
    setIsLocalAdmin(false);

    try {
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.deleteItemAsync(ADMIN_SESSION_KEY);
        } catch {}
      }
      if (AsyncStorageModule?.removeItem) {
        try {
          await AsyncStorageModule.removeItem(ADMIN_SESSION_KEY);
        } catch {}
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }

      if (isClerkSignedIn) {
        await clerkSignOut();
      }
    } catch (err) {
      console.warn('[Auth] Logout error:', err);
    }
  }, [isClerkSignedIn, clerkSignOut]);

  const isLoaded = isClerkLoaded && isStorageLoaded;
  const isAuthenticated = Boolean(isClerkSignedIn || isLocalAdmin || globalAdminActive);

  // Compute normalized user profile
  let userProfile: AppUser | null = null;
  if (isLocalAdmin && !isClerkSignedIn) {
    userProfile = {
      id: 'admin_master_uid',
      email: ADMIN_CREDENTIALS.email,
      name: ADMIN_CREDENTIALS.name,
      isAdmin: true,
    };
  } else if (clerkUser) {
    const email = clerkUser.primaryEmailAddress?.emailAddress || '';
    const isAdmin =
      email.toLowerCase().startsWith('admin@') ||
      email.toLowerCase().endsWith('@pandra.dev') ||
      email === 'joulessies@gmail.com' ||
      Boolean(clerkUser.publicMetadata?.isAdmin || clerkUser.publicMetadata?.role === 'admin');

    userProfile = {
      id: clerkUser.id,
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
        : email.split('@')[0] || 'Pandra Builder',
      isAdmin,
    };
  }

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isAuthenticated,
        isLocalAdmin,
        user: userProfile,
        clerkUser,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAppAuth = () => useContext(AuthContext);
