import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { useAppAuth } from "./auth-provider";
import { getFirstRegistrationDate } from "@/services/widget-storage";
import { useRevenueCatStore } from "@/stores";

const ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || "pandra_pro";
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY || "";

const ADMIN_EMAILS = [
  "admin@pandra.dev",
  "admin@gmail.com",
  "joulessies@gmail.com",
  "julius@pandra.dev",
  "admin@test.com",
  "admin@example.com",
];

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLocalAdmin, isLoaded: isAuthLoaded } = useAppAuth();

  const isConfigured = useRevenueCatStore((state) => state.isConfigured);
  const setConfigured = useRevenueCatStore((state) => state.setConfigured);
  const setCustomerInfo = useRevenueCatStore((state) => state.setCustomerInfo);
  const setOfferings = useRevenueCatStore((state) => state.setOfferings);
  const setTrialState = useRevenueCatStore((state) => state.setTrialState);
  const setLoading = useRevenueCatStore((state) => state.setLoading);
  const setAdmin = useRevenueCatStore((state) => state.setAdmin);

  const hasValidApiKey =
    Boolean(ANDROID_API_KEY) &&
    ANDROID_API_KEY !== "goog_your_android_api_key_here" &&
    !ANDROID_API_KEY.includes("your_android_api_key") &&
    (__DEV__ || !ANDROID_API_KEY.startsWith("test_"));

  const isNativeAndroid = Platform.OS === "android";

  // 1. Calculate and sync trial state
  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      getFirstRegistrationDate(user.id).then((ts) => {
        if (!isMounted) return;
        const now = Date.now();
        const elapsed = Math.max(0, now - ts);
        const duration = 7 * 24 * 60 * 60 * 1000;
        const active = elapsed < duration;
        const days = Math.max(
          1,
          Math.ceil((duration - elapsed) / (24 * 60 * 60 * 1000)),
        );
        setTrialState(active, days);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id, setTrialState]);

  // 2. Initialize RevenueCat once
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let isMounted = true;

    async function initRevenueCat() {
      try {
        if (isNativeAndroid && hasValidApiKey) {
          if (__DEV__) {
            try {
              await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            } catch {}
          }

          try {
            Purchases.configure({
              apiKey: ANDROID_API_KEY,
              appUserID: user?.id || null,
            });

            if (isMounted) {
              setConfigured(true);
            }

            Purchases.addCustomerInfoUpdateListener((info) => {
              if (isMounted) {
                setCustomerInfo(info);
              }
            });

            const [info, currentOfferings] = await Promise.all([
              Purchases.getCustomerInfo().catch(() => null),
              Purchases.getOfferings().catch((err) => {
                console.warn("[RevenueCat] Failed to fetch offerings:", err);
                return null;
              }),
            ]);

            if (isMounted) {
              if (info) setCustomerInfo(info);
              if (currentOfferings) setOfferings(currentOfferings);
            }
          } catch (configErr) {
            console.warn("[RevenueCat] Purchases.configure failed, falling back:", configErr);
            if (isMounted) {
              setConfigured(false);
            }
          }
        } else {
          console.log(
            `[RevenueCat] Initialized in sandbox/fallback mode (Platform: ${Platform.OS}, configured: ${hasValidApiKey})`,
          );
          if (isMounted) {
            setConfigured(false);
          }
        }
      } catch (error) {
        console.error("[RevenueCat] Initialization error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initRevenueCat();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Sync Clerk Auth state with RevenueCat user
  useEffect(() => {
    if (!isConfigured || !isAuthLoaded) return;

    let isMounted = true;

    async function syncAuthUser() {
      try {
        if (user?.id) {
          const { customerInfo: loggedInInfo } = await Purchases.logIn(user.id);
          if (isMounted) setCustomerInfo(loggedInInfo);
        } else {
          const isAnon = await Purchases.isAnonymous();
          if (!isAnon) {
            const loggedOutInfo = await Purchases.logOut();
            if (isMounted) setCustomerInfo(loggedOutInfo);
          }
        }
      } catch (err) {
        console.warn("[RevenueCat] Failed to sync Clerk auth state:", err);
      }
    }

    syncAuthUser();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isConfigured, isAuthLoaded, setCustomerInfo]);

  // 4. Sync admin privileges
  useEffect(() => {
    const userEmail = user?.email?.toLowerCase() || "";
    const isAdmin =
      isLocalAdmin ||
      Boolean(user?.isAdmin) ||
      ADMIN_EMAILS.includes(userEmail) ||
      userEmail.startsWith("admin@") ||
      userEmail.includes("+admin@") ||
      userEmail.endsWith("@pandra.dev");

    setAdmin(isAdmin);
  }, [user?.email, user?.isAdmin, isLocalAdmin, setAdmin]);

  return <>{children}</>;
};

export const useRevenueCat = () => {
  const store = useRevenueCatStore();
  const { user, isLocalAdmin } = useAppAuth();

  const userEmail = user?.email?.toLowerCase() || "";
  const isAdmin =
    isLocalAdmin ||
    Boolean(user?.isAdmin) ||
    ADMIN_EMAILS.includes(userEmail) ||
    userEmail.startsWith("admin@") ||
    userEmail.includes("+admin@") ||
    userEmail.endsWith("@pandra.dev");

  const isPro =
    isAdmin ||
    store.isTrialActive ||
    (store.simulatedPro ?? false) ||
    Boolean(store.customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive);

  return {
    isConfigured: store.isConfigured,
    isPro,
    isAdmin,
    isTrialActive: store.isTrialActive,
    trialDaysRemaining: store.trialDaysRemaining,
    isLoading: store.isLoading,
    customerInfo: store.customerInfo,
    offerings: store.offerings,
    entitlementId: store.entitlementId,
    purchasePackage: store.purchasePackage,
    restorePurchases: store.restorePurchases,
    refreshCustomerInfo: store.refreshCustomerInfo,
    simulateUnlockPro: store.simulateUnlockPro,
  };
};
