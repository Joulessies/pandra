import React, { useEffect } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth, useUser } from "@clerk/expo";
import { useAuthStore } from "@/stores";

const ADMIN_SESSION_KEY = "pandra_local_admin_active";

let AsyncStorageModule: any = null;
try {
  AsyncStorageModule =
    require("@react-native-async-storage/async-storage").default ||
    require("@react-native-async-storage/async-storage");
} catch {
  AsyncStorageModule = null;
}

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const setLoaded = useAuthStore((state) => state.setLoaded);
  const setLocalAdmin = useAuthStore((state) => state.setLocalAdmin);
  const setClerkUser = useAuthStore((state) => state.setClerkUser);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const isLocalAdmin = useAuthStore((state) => state.isLocalAdmin);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminSession() {
      try {
        let val: string | null = null;

        if (Platform.OS !== "web") {
          try {
            val = await SecureStore.getItemAsync(ADMIN_SESSION_KEY);
          } catch {}
        }

        if (!val && AsyncStorageModule?.getItem) {
          try {
            val = await AsyncStorageModule.getItem(ADMIN_SESSION_KEY);
          } catch {}
        }

        if (!val && typeof localStorage !== "undefined") {
          val = localStorage.getItem(ADMIN_SESSION_KEY);
        }

        if (val === "true" && isMounted) {
          setLocalAdmin(true);
        }
      } catch (err) {
        console.warn("[Auth] Failed to load local admin session:", err);
      } finally {
        if (isMounted) {
          setLoaded(true);
        }
      }
    }

    loadAdminSession();
    return () => {
      isMounted = false;
    };
  }, [setLoaded, setLocalAdmin]);

  useEffect(() => {
    if (isClerkLoaded) {
      setClerkUser(clerkUser);

      if (isClerkSignedIn && clerkUser) {
        setAuthenticated(true);

        const email = clerkUser.primaryEmailAddress?.emailAddress || "";
        const isAdmin =
          email.toLowerCase().startsWith("admin@") ||
          email.toLowerCase().endsWith("@pandra.dev") ||
          email === "joulessies@gmail.com" ||
          Boolean(
            clerkUser.publicMetadata?.isAdmin ||
            clerkUser.publicMetadata?.role === "admin",
          );

        setUser({
          id: clerkUser.id,
          email,
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : email.split("@")[0] || "Pandra Builder",
          isAdmin,
        });
      } else if (!isLocalAdmin) {
        setAuthenticated(false);
        setUser(null);
      }
    }
  }, [
    isClerkLoaded,
    isClerkSignedIn,
    clerkUser,
    isLocalAdmin,
    setAuthenticated,
    setClerkUser,
    setUser,
  ]);

  return <>{children}</>;
};

export const useAppAuth = () => {
  const isLoaded = useAuthStore((state) => state.isLoaded);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLocalAdmin = useAuthStore((state) => state.isLocalAdmin);
  const user = useAuthStore((state) => state.user);
  const clerkUser = useAuthStore((state) => state.clerkUser);
  const loginAsAdmin = useAuthStore((state) => state.loginAsAdmin);
  const storeLogout = useAuthStore((state) => state.logout);
  const { isSignedIn, signOut } = useAuth();
  const logout = async () => {
    await storeLogout();
    if (isSignedIn) {
      await signOut();
    }
  };
  return {
    isLoaded,
    isAuthenticated,
    isLocalAdmin,
    user,
    clerkUser,
    loginAsAdmin,
    logout,
  };
};

export type { AppUser } from "@/stores";
