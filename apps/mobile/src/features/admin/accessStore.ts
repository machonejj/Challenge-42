/**
 * Tracks the signed-in user's access flags (admin? disabled?). On sign-in the app calls refresh();
 * a disabled account is signed straight back out, and admins unlock the admin dashboard.
 */
import { create } from 'zustand';
import { myAccess } from './adminService';

interface AccessState {
  isAdmin: boolean;
  checked: boolean;
  /** Returns true if the account is disabled (caller should sign out). */
  refresh: () => Promise<boolean>;
  clear: () => void;
}

export const useAccessStore = create<AccessState>((set) => ({
  isAdmin: false,
  checked: false,
  refresh: async () => {
    const access = await myAccess();
    set({ isAdmin: access?.isAdmin ?? false, checked: true });
    return access?.disabled ?? false;
  },
  clear: () => set({ isAdmin: false, checked: false }),
}));
