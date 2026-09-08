import { create } from "zustand";

interface OnboardingState {
  currentStep: number;
  selectedRole: string;
  highlightedTile: number | null;
  isPaywallOpen: boolean;
  selectedPresetId: string;
  promptText: string;
  isSynthesizing: boolean;
  apiFetching: boolean;
  liveBtcPrice: string;

  setCurrentStep: (step: number) => void;
  setSelectedRole: (role: string) => void;
  setHighlightedTile: (tile: number | null) => void;
  setPaywallOpen: (open: boolean) => void;
  setSelectedPresetId: (id: string) => void;
  setPromptText: (text: string) => void;
  setIsSynthesizing: (synthesizing: boolean) => void;
  setApiFetching: (fetching: boolean) => void;
  setLiveBtcPrice: (price: string) => void;
  reset: () => void;
}

const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 0,
  selectedRole: "",
  highlightedTile: null,
  isPaywallOpen: false,
  selectedPresetId: "",
  promptText: "",
  isSynthesizing: false,
  apiFetching: false,
  liveBtcPrice: "",

  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedRole: (role) => set({ selectedRole: role }),
  setHighlightedTile: (tile) => set({ highlightedTile: tile }),
  setPaywallOpen: (open) => set({ isPaywallOpen: open }),
  setSelectedPresetId: (id) => set({ selectedPresetId: id }),
  setPromptText: (text) => set({ promptText: text }),
  setIsSynthesizing: (synthesizing) => set({ isSynthesizing: synthesizing }),
  setApiFetching: (fetching) => set({ apiFetching: fetching }),
  setLiveBtcPrice: (price) => set({ liveBtcPrice: price }),

  reset: () =>
    set({
      currentStep: 0,
      selectedRole: "",
      highlightedTile: null,
      isPaywallOpen: false,
      selectedPresetId: "",
      promptText: "",
      isSynthesizing: false,
      apiFetching: false,
      liveBtcPrice: "",
    }),
}));

export default useOnboardingStore;
