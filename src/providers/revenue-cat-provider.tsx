import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { useAppAuth } from './auth-provider';
import { getFirstRegistrationDate } from '@/services/widget-storage';

export interface RevenueCatContextType {
  isConfigured: boolean;
  isPro: boolean;
  isAdmin: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  entitlementId: string;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  simulateUnlockPro?: (unlock: boolean) => void;
}

const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || 'pandra_pro';
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY || '';

const ADMIN_EMAILS = [
  'admin@pandra.dev',
  'admin@gmail.com',
  'joulessies@gmail.com',
  'julius@pandra.dev',
  'admin@test.com',
  'admin@example.com',
];

const RevenueCatContext = createContext<RevenueCatContextType>({
  isConfigured: false,
  isPro: false,
  isAdmin: false,
  isTrialActive: true,
  trialDaysRemaining: 7,
  isLoading: true,
  customerInfo: null,
  offerings: null,
  entitlementId: ENTITLEMENT_ID,
  purchasePackage: async () => false,
  restorePurchases: async () => null,
  refreshCustomerInfo: async () => null,
});

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLocalAdmin, isLoaded: isAuthLoaded } = useAppAuth();

  const [isConfigured, setIsConfigured] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simulatedPro, setSimulatedPro] = useState(false);
  const [trialState, setTrialState] = useState<{ isTrialActive: boolean; trialDaysRemaining: number }>({
    isTrialActive: true,
    trialDaysRemaining: 7,
  });

  useEffect(() => {
    let isMounted = true;
    getFirstRegistrationDate(user?.id).then((ts) => {
      if (!isMounted) return;
      const now = Date.now();
      const elapsed = Math.max(0, now - ts);
      const duration = 7 * 24 * 60 * 60 * 1000;
      const active = elapsed < duration;
      const days = Math.max(1, Math.ceil((duration - elapsed) / (24 * 60 * 60 * 1000)));
      setTrialState({ isTrialActive: active, trialDaysRemaining: days });
    });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Check if live Android API key is set
  const hasValidApiKey =
    Boolean(ANDROID_API_KEY) &&
    ANDROID_API_KEY !== 'goog_your_android_api_key_here' &&
    !ANDROID_API_KEY.includes('your_android_api_key');

  const isNativeAndroid = Platform.OS === 'android';

  // Initialize RevenueCat SDK
  useEffect(() => {
    let isMounted = true;

    async function initRevenueCat() {
      try {
        if (isNativeAndroid && hasValidApiKey) {
          if (__DEV__) {
            await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
          }

          // Configure RevenueCat with Android Key
          Purchases.configure({
            apiKey: ANDROID_API_KEY,
            appUserID: user?.id || null,
          });

          if (isMounted) {
            setIsConfigured(true);
          }

          // Set up real-time listener for subscription updates
          Purchases.addCustomerInfoUpdateListener((info) => {
            if (isMounted) {
              setCustomerInfo(info);
            }
          });

          // Fetch initial customer info & offerings
          const [info, currentOfferings] = await Promise.all([
            Purchases.getCustomerInfo(),
            Purchases.getOfferings().catch((err) => {
              console.warn('[RevenueCat] Failed to fetch offerings:', err);
              return null;
            }),
          ]);

          if (isMounted) {
            setCustomerInfo(info);
            setOfferings(currentOfferings);
          }
        } else {
          // Running in Expo Go, Web, or keys not yet configured
          console.log(
            `[RevenueCat] Initialized in sandbox/fallback mode (Platform: ${Platform.OS}, configured: ${hasValidApiKey})`
          );
          if (isMounted) {
            setIsConfigured(false);
          }
        }
      } catch (error) {
        console.error('[RevenueCat] Initialization error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initRevenueCat();

    return () => {
      isMounted = false;
    };
  }, [hasValidApiKey, isNativeAndroid, user?.id]);

  // Sync authentication with RevenueCat user identity
  useEffect(() => {
    if (!isConfigured || !isAuthLoaded) return;

    async function syncAuthUser() {
      try {
        if (user?.id) {
          const { customerInfo: loggedInInfo } = await Purchases.logIn(user.id);
          setCustomerInfo(loggedInInfo);
        } else {
          const loggedOutInfo = await Purchases.logOut();
          setCustomerInfo(loggedOutInfo);
        }
      } catch (err) {
        console.warn('[RevenueCat] Failed to sync Clerk auth state:', err);
      }
    }

    syncAuthUser();
  }, [user?.id, isConfigured, isAuthLoaded]);

  // Purchase a package handler
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      if (!isConfigured) {
        // Development Sandbox Simulation
        Alert.alert(
          'Sandbox Purchase',
          `Simulated purchase for ${pkg.identifier || 'Pandra Pro'}. Unlocking Pro features for testing.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSimulatedPro(true);
              },
            },
          ]
        );
        setSimulatedPro(true);
        return true;
      }

      try {
        setIsLoading(true);
        const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
        setCustomerInfo(updatedInfo);
        const active = Boolean(updatedInfo.entitlements.active[ENTITLEMENT_ID]?.isActive);
        return active;
      } catch (error: any) {
        if (!error.userCancelled) {
          console.error('[RevenueCat] Purchase failed:', error);
          Alert.alert('Purchase Error', error.message || 'Unable to complete purchase.');
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured]
  );

  // Restore purchases handler (Mandatory for App Store & Google Play review)
  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!isConfigured) {
      Alert.alert('Sandbox Restore', 'Simulated purchase restoration.');
      setSimulatedPro(true);
      return null;
    }

    try {
      setIsLoading(true);
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);
      const active = Boolean(restoredInfo.entitlements.active[ENTITLEMENT_ID]?.isActive);
      if (active) {
        Alert.alert('Purchases Restored', 'Your Pandra Pro subscription has been restored!');
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found to restore.');
      }
      return restoredInfo;
    } catch (error: any) {
      console.error('[RevenueCat] Restore failed:', error);
      Alert.alert('Restore Error', error.message || 'Unable to restore purchases.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  // Refresh customer info manually
  const refreshCustomerInfo = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!isConfigured) return null;
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (err) {
      console.warn('[RevenueCat] Refresh customer info failed:', err);
      return null;
    }
  }, [isConfigured]);

  // Computed 7-Day Pro Explorer Trial
  const { isTrialActive, trialDaysRemaining } = trialState;

  // Computed Admin & Pro Status
  const userEmail = user?.email?.toLowerCase() || '';
  const isAdmin =
    isLocalAdmin ||
    Boolean(user?.isAdmin) ||
    ADMIN_EMAILS.includes(userEmail) ||
    userEmail.startsWith('admin@') ||
    userEmail.includes('+admin@') ||
    userEmail.endsWith('@pandra.dev');

  const isPro =
    isAdmin ||
    isTrialActive ||
    simulatedPro ||
    Boolean(customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive);

  return (
    <RevenueCatContext.Provider
      value={{
        isConfigured,
        isPro,
        isAdmin,
        isTrialActive,
        trialDaysRemaining,
        isLoading,
        customerInfo,
        offerings,
        entitlementId: ENTITLEMENT_ID,
        purchasePackage,
        restorePurchases,
        refreshCustomerInfo,
        simulateUnlockPro: setSimulatedPro,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => useContext(RevenueCatContext);
