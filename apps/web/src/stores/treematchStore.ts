import { create } from 'zustand';

// Dummy-UI store for the TreeMatch prototype. In the real build this state comes
// from the server (per-project ForestCloud connection + matching flag).
//
// TreeMatch is auto-enabled for workspaces that have Plant-for-the-Planet
// (ForestCloud) projects. The ForestCloud settings panel is where it is turned
// on or off; the TreeMatch page reads the same flag.
interface TreematchStore {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

export const useTreematchStore = create<TreematchStore>((set) => ({
  enabled: true,
  setEnabled: (v) => set({ enabled: v }),
}));
