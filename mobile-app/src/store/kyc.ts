/** KYC store — identity verification status, decided by staff in the admin panel. */
import { create } from 'zustand';
import * as api from '../api/backend';
import { notify } from './notifications';

export type KycStatus = api.KycState;

interface KycState {
  status: KycStatus;
  /** Staff's note when the last submission was rejected. */
  rejectionReason: string | null;
  /** Server status; pass the user id for live updates to announce staff decisions. */
  setStatus: (status: KycStatus, announceForUserId?: string) => void;
  load: (userId: string) => Promise<void>;
  submit: (userId: string, documentType: api.IdDocumentType, files: api.KycFile[]) => Promise<string | null>;
  reset: () => void;
}

export const useKycStore = create<KycState>((set, get) => ({
  status: 'unverified',
  rejectionReason: null,

  setStatus: (status, announceForUserId) => {
    const prev = get().status;
    set({ status });
    if (!announceForUserId || prev === status) return;
    if (status === 'verified') {
      notify({ kind: 'info', title: 'Verification approved', body: 'Your identity has been verified.' });
    } else if (status === 'rejected') {
      notify({ kind: 'info', title: 'Verification rejected', body: 'Please check the reason on your Profile and resubmit.' });
      void get().load(announceForUserId); // pick up the reviewer's note
    }
  },

  load: async (userId) => {
    set({ rejectionReason: await api.fetchKycRejectionReason(userId).catch(() => null) });
  },

  submit: async (userId, documentType, files) => {
    try {
      await api.submitKyc(userId, documentType, files);
      set({ status: 'pending', rejectionReason: null });
      return null;
    } catch (e) {
      return e instanceof api.BackendError ? e.message : 'Upload failed. Check your connection and try again.';
    }
  },

  reset: () => set({ status: 'unverified', rejectionReason: null }),
}));
