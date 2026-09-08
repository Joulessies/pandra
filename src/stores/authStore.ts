import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ADMIN_CREDENTIALS } from "@/services/widget-storage";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthState {
  isLoaded: boolean;
  isAuthenticated: boolean;
  isLocalAdmin: boolean;
  user: AppUser | null;
  clerkUser: any;
  setLoaded: (loaded: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
  setUser: (user: AppUser | null) => void;
  setClerkUser: (user: any) => void;
  setLocalAdmin: (isAdmin: boolean) => void;
  loginAsAdmin: (credentials?: {
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoaded: false,
      isAuthenticated: false,
      isLocalAdmin: false,
      user: null,
      clerkUser: null,

      setLoaded: (loaded) => set({ isLoaded: loaded }),
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
      setUser: (user) => set({ user }),
      setClerkUser: (clerkUser) => set({ clerkUser }),
      setLocalAdmin: (isAdmin) =>
        set(
          isAdmin
            ? {
                isLocalAdmin: true,
                isAuthenticated: true,
                user: {
                  id: "admin-local",
                  email: ADMIN_CREDENTIALS.email,
                  name: ADMIN_CREDENTIALS.name,
                  isAdmin: true,
                },
              }
            : { isLocalAdmin: false },
        ),

      loginAsAdmin: async (credentials = ADMIN_CREDENTIALS) => {
        if (
          credentials.email === ADMIN_CREDENTIALS.email &&
          credentials.password === ADMIN_CREDENTIALS.password
        ) {
          set({
            isLocalAdmin: true,
            isAuthenticated: true,
            user: {
              id: "admin-local",
              email: ADMIN_CREDENTIALS.email,
              name: ADMIN_CREDENTIALS.name,
              isAdmin: true,
            },
          });

          if (Platform.OS !== "web") {
            try {
              await SecureStore.setItemAsync(
                "pandra_local_admin_active",
                "true",
              );
            } catch (err) {
              console.warn("Failed to persist admin session:", err);
            }
          }
        } else {
          throw new Error("Invalid admin credentials");
        }
      },

      logout: async () => {
        set({
          isAuthenticated: false,
          isLocalAdmin: false,
          user: null,
          clerkUser: null,
        });

        if (Platform.OS !== "web") {
          try {
            await SecureStore.deleteItemAsync("pandra_local_admin_active");
          } catch (err) {
            console.warn("Failed to clear admin session:", err);
          }
        }
      },

      reset: () =>
        set({
          isLoaded: false,
          isAuthenticated: false,
          isLocalAdmin: false,
          user: null,
          clerkUser: null,
        }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        isLocalAdmin: state.isLocalAdmin,
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
