import React, { useEffect } from "react";
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
  const revenueCatStore = useRevenueCatStore();

  const hasValidApiKey =
    Boolean(ANDROID_API_KEY) &&
    ANDROID_API_KEY !== "goog_your_android_api_key_here" &&
    !ANDROID_API_KEY.includes("your_android_api_key");

  const isNativeAndroid = Platform.OS === "android";

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
        revenueCatStore.setTrialState(active, days);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id, revenueCatStore]);

  useEffect(() => {
    let isMounted = true;

    async function initRevenueCat() {
      try {
        if (isNativeAndroid && hasValidApiKey) {
          if (__DEV__) {
            await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
          }

          Purchases.configure({
            apiKey: ANDROID_API_KEY,
            appUserID: user?.id || null,
          });

          if (isMounted) {
            revenueCatStore.setConfigured(true);
          }

          Purchases.addCustomerInfoUpdateListener((info) => {
            if (isMounted) {
              revenueCatStore.setCustomerInfo(info);
            }
          });

          const [info, currentOfferings] = await Promise.all([
            Purchases.getCustomerInfo(),
            Purchases.getOfferings().catch((err) => {
              console.warn("[RevenueCat] Failed to fetch offerings:", err);
              return null;
            }),
          ]);

          if (isMounted) {
            revenueCatStore.setCustomerInfo(info);
            revenueCatStore.setOfferings(currentOfferings);
          }
        } else {
          console.log(
            `[RevenueCat] Initialized in sandbox/fallback mode (Platform: ${Platform.OS}, configured: ${hasValidApiKey})`,
          );
          if (isMounted) {
            revenueCatStore.setConfigured(false);
          }
        }
      } catch (error) {
        console.error("[RevenueCat] Initialization error:", error);
      } finally {
        if (isMounted) {
          revenueCatStore.setLoading(false);
        }
      }
    }

    initRevenueCat();

    return () => {
      isMounted = false;
    };
  }, [hasValidApiKey, isNativeAndroid, user?.id, revenueCatStore]);

  useEffect(() => {
    if (!revenueCatStore.isConfigured || !isAuthLoaded) return;

    async function syncAuthUser() {
      try {
        if (user?.id) {
          const { customerInfo: loggedInInfo } = await Purchases.logIn(user.id);
          revenueCatStore.setCustomerInfo(loggedInInfo);
        } else {
          const isAnon = await Purchases.isAnonymous();
          if (!isAnon) {
            const loggedOutInfo = await Purchases.logOut();
            revenueCatStore.setCustomerInfo(loggedOutInfo);
          }
        }
      } catch (err) {
        console.warn("[RevenueCat] Failed to sync Clerk auth state:", err);
      }
    }

    syncAuthUser();
  }, [user?.id, revenueCatStore.isConfigured, isAuthLoaded, revenueCatStore]);

  useEffect(() => {
    const userEmail = user?.email?.toLowerCase() || "";
    const isAdmin =
      isLocalAdmin ||
      Boolean(user?.isAdmin) ||
      ADMIN_EMAILS.includes(userEmail) ||
      userEmail.startsWith("admin@") ||
      userEmail.includes("+admin@") ||
      userEmail.endsWith("@pandra.dev");

    revenueCatStore.setAdmin(isAdmin);
  }, [user, isLocalAdmin, revenueCatStore]);

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
