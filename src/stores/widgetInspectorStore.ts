import { create } from "zustand";

interface WidgetInspectorState {
  activeTab: "remix" | "diagnostics" | "alerts" | "raw_json";
  isRefreshing: boolean;
  rawJsonResponse: string | null;
  remixPrompt: string;
  isRemixing: boolean;
  alertEnabled: boolean;
  alertCondition: "gt" | "lt" | "eq";
  alertThreshold: string;
  alertMessage: string;

  setActiveTab: (tab: "remix" | "diagnostics" | "alerts" | "raw_json") => void;
  setIsRefreshing: (refreshing: boolean) => void;
  setRawJsonResponse: (response: string | null) => void;
  setRemixPrompt: (prompt: string) => void;
  setIsRemixing: (remixing: boolean) => void;
  setAlertEnabled: (enabled: boolean) => void;
  setAlertCondition: (condition: "gt" | "lt" | "eq") => void;
  setAlertThreshold: (threshold: string) => void;
  setAlertMessage: (message: string) => void;
  reset: () => void;
}

const useWidgetInspectorStore = create<WidgetInspectorState>((set) => ({
  activeTab: "remix",
  isRefreshing: false,
  rawJsonResponse: null,
  remixPrompt: "",
  isRemixing: false,
  alertEnabled: false,
  alertCondition: "gt",
  alertThreshold: "",
  alertMessage: "",

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  setRawJsonResponse: (response) => set({ rawJsonResponse: response }),
  setRemixPrompt: (prompt) => set({ remixPrompt: prompt }),
  setIsRemixing: (remixing) => set({ isRemixing: remixing }),
  setAlertEnabled: (enabled) => set({ alertEnabled: enabled }),
  setAlertCondition: (condition) => set({ alertCondition: condition }),
  setAlertThreshold: (threshold) => set({ alertThreshold: threshold }),
  setAlertMessage: (message) => set({ alertMessage: message }),

  reset: () =>
    set({
      activeTab: "remix",
      isRefreshing: false,
      rawJsonResponse: null,
      remixPrompt: "",
      isRemixing: false,
      alertEnabled: false,
      alertCondition: "gt",
      alertThreshold: "",
      alertMessage: "",
    }),
}));

export default useWidgetInspectorStore;
