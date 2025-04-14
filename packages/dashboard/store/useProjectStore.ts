import { create } from 'zustand';


interface Projects{
    id: number;
    name: string;
    description: string;
    status: string;
}

// Define the store state and actions interface
interface ProjectStore {
  projects: Projects[] ;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
}

// Create the typed store
const useStore = create<ProjectStore>((set) => ({
  projects: [],
  increase: () => set((state) => ({ count: state.count + 1 })),
  decrease: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}));

export default useStore;