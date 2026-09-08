import { create } from "zustand";

interface UIState {
  isPaywallOpen: boolean;
  paywallContext: string;
  isBuilderModalOpen: boolean;
  isAiModalOpen: boolean;
  initialAiPrompt: string;
  isHomeScreenModalOpen: boolean;
  isFirstLaunchModalOpen: boolean;
  isNewDeckModalOpen: boolean;
  isOrganizeMode: boolean;

  setPaywallOpen: (open: boolean, context?: string) => void;
  setBuilderModalOpen: (open: boolean) => void;
  setAiModalOpen: (open: boolean, prompt?: string) => void;
  setHomeScreenModalOpen: (open: boolean) => void;
  setFirstLaunchModalOpen: (open: boolean) => void;
  setNewDeckModalOpen: (open: boolean) => void;
  setOrganizeMode: (organize: boolean) => void;
  closeAllModals: () => void;
}

const useUIStore = create<UIState>((set) => ({
  isPaywallOpen: false,
  paywallContext: "",
  isBuilderModalOpen: false,
  isAiModalOpen: false,
  initialAiPrompt: "",
  isHomeScreenModalOpen: false,
  isFirstLaunchModalOpen: false,
  isNewDeckModalOpen: false,
  isOrganizeMode: false,

  setPaywallOpen: (open, context = "") =>
    set({ isPaywallOpen: open, paywallContext: context }),
  setBuilderModalOpen: (open) => set({ isBuilderModalOpen: open }),
  setAiModalOpen: (open, prompt = "") =>
    set({ isAiModalOpen: open, initialAiPrompt: prompt }),
  setHomeScreenModalOpen: (open) => set({ isHomeScreenModalOpen: open }),
  setFirstLaunchModalOpen: (open) => set({ isFirstLaunchModalOpen: open }),
  setNewDeckModalOpen: (open) => set({ isNewDeckModalOpen: open }),
  setOrganizeMode: (organize) => set({ isOrganizeMode: organize }),

  closeAllModals: () =>
    set({
      isPaywallOpen: false,
      isBuilderModalOpen: false,
      isAiModalOpen: false,
      isHomeScreenModalOpen: false,
      isFirstLaunchModalOpen: false,
      isNewDeckModalOpen: false,
      initialAiPrompt: "",
      paywallContext: "",
    }),
}));

export default useUIStore;
