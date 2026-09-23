import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";

export interface RevenueCatState {
  isConfigured: boolean;
  isPro: boolean;
  isAdmin: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  entitlementId: string;
  simulatedPro?: boolean;

  setConfigured: (configured: boolean) => void;
  setCustomerInfo: (info: CustomerInfo | null) => void;
  setOfferings: (offerings: PurchasesOfferings | null) => void;
  setTrialState: (isActive: boolean, daysRemaining: number) => void;
  setLoading: (loading: boolean) => void;
  setPro: (isPro: boolean) => void;
  setAdmin: (isAdmin: boolean) => void;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  simulateUnlockPro: (unlock: boolean) => void;
  reset: () => void;
}

const ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || "pandra_pro";

const safeStorage = {
  getItem: async (name: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
        return await AsyncStorage.getItem(name);
      }
    } catch {}
    return null;
  },
  setItem: async (name: string, value: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === "function") {
        await AsyncStorage.setItem(name, value);
      }
    } catch {}
  },
  removeItem: async (name: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === "function") {
        await AsyncStorage.removeItem(name);
      }
    } catch {}
  },
};

const useRevenueCatStore = create<RevenueCatState>()(
  persist(
    (set) => ({
      isConfigured: false,
      isPro: false,
      isAdmin: false,
      isTrialActive: true,
      trialDaysRemaining: 7,
      isLoading: true,
      customerInfo: null,
      offerings: null,
      entitlementId: ENTITLEMENT_ID,
      simulatedPro: false,

      setConfigured: (configured) =>
        set((state) =>
          state.isConfigured === configured
            ? state
            : { isConfigured: configured },
        ),
      setCustomerInfo: (info) => set({ customerInfo: info }),
      setOfferings: (offerings) => set({ offerings }),

      setTrialState: (isActive, daysRemaining) =>
        set((state) =>
          state.isTrialActive === isActive &&
          state.trialDaysRemaining === daysRemaining
            ? state
            : { isTrialActive: isActive, trialDaysRemaining: daysRemaining },
        ),

      setLoading: (loading) =>
        set((state) =>
          state.isLoading === loading ? state : { isLoading: loading },
        ),
      setPro: (isPro) =>
        set((state) => (state.isPro === isPro ? state : { isPro })),
      setAdmin: (isAdmin) =>
        set((state) => (state.isAdmin === isAdmin ? state : { isAdmin })),

      purchasePackage: async (pkg) => {
        try {
          set({ isLoading: true });
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          const isPro =
            customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          set({ customerInfo, isPro, isLoading: false });
          return isPro;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      restorePurchases: async () => {
        try {
          set({ isLoading: true });
          const customerInfo = await Purchases.restorePurchases();
          const isPro =
            customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          set({ customerInfo, isPro, isLoading: false });
          return customerInfo;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      refreshCustomerInfo: async () => {
        try {
          set({ isLoading: true });
          const customerInfo = await Purchases.getCustomerInfo();
          const isPro =
            customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          set({ customerInfo, isPro, isLoading: false });
          return customerInfo;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      simulateUnlockPro: (unlock) => {
        set({ simulatedPro: unlock, isPro: unlock });
      },

      reset: () =>
        set({
          isConfigured: false,
          isPro: false,
          isAdmin: false,
          isTrialActive: true,
          trialDaysRemaining: 7,
          isLoading: true,
          customerInfo: null,
          offerings: null,
          simulatedPro: false,
        }),
    }),
    {
      name: "revenucat-store",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        isPro: state.isPro,
        isTrialActive: state.isTrialActive,
        trialDaysRemaining: state.trialDaysRemaining,
        simulatedPro: state.simulatedPro,
      }),
    },
  ),
);

export default useRevenueCatStore;
