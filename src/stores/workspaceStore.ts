import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CustomWidget, DeckWorkspace } from "@/types/widget";

interface WorkspaceState {
  widgets: CustomWidget[];
  workspaces: DeckWorkspace[];
  activeWorkspaceId: string;
  inspectorWidget: CustomWidget | null;
  editingWidget: CustomWidget | null;
  isRefreshing: boolean;
  loggingOut: boolean;

  setWidgets: (widgets: CustomWidget[]) => void;
  addWidget: (widget: CustomWidget) => void;
  updateWidget: (id: string, widget: Partial<CustomWidget>) => void;
  removeWidget: (id: string) => void;

  setWorkspaces: (workspaces: DeckWorkspace[]) => void;
  addWorkspace: (workspace: DeckWorkspace) => void;
  updateWorkspace: (id: string, workspace: Partial<DeckWorkspace>) => void;
  removeWorkspace: (id: string) => void;

  setActiveWorkspaceId: (id: string) => void;
  setInspectorWidget: (widget: CustomWidget | null) => void;
  setEditingWidget: (widget: CustomWidget | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  setLoggingOut: (loggingOut: boolean) => void;

  reset: () => void;
}

const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      widgets: [],
      workspaces: [],
      activeWorkspaceId: "",
      inspectorWidget: null,
      editingWidget: null,
      isRefreshing: false,
      loggingOut: false,

      setWidgets: (widgets) => set({ widgets }),

      addWidget: (widget) =>
        set((state) => ({
          widgets: [...state.widgets, widget],
        })),

      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w,
          ),
        })),

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      setWorkspaces: (workspaces) => set({ workspaces }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),

      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, ...updates } : w,
          ),
        })),

      removeWorkspace: (id) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id),
        })),

      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      setInspectorWidget: (widget) => set({ inspectorWidget: widget }),
      setEditingWidget: (widget) => set({ editingWidget: widget }),
      setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
      setLoggingOut: (loggingOut) => set({ loggingOut }),

      reset: () =>
        set({
          widgets: [],
          workspaces: [],
          activeWorkspaceId: "",
          inspectorWidget: null,
          editingWidget: null,
          isRefreshing: false,
          loggingOut: false,
        }),
    }),
    {
      name: "workspace-store",
      partialize: (state) => ({
        workspaces: state.workspaces,
        widgets: state.widgets,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    },
  ),
);

export default useWorkspaceStore;
