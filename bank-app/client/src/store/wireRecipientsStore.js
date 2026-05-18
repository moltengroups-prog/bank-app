import { create } from 'zustand';
import { api } from '../services/api';

export const useWireRecipientsStore = create((set, get) => ({
  recipients:           [],
  selectedRecipient:    null,
  selectedFromAccount:  null,
  amount:               '',
  memo:                 '',
  wireResult:           null,
  loading:              false,
  error:                null,

  loadRecipients: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await api.get('/wire-recipients');
      set({ recipients: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addRecipient: async (recipientData) => {
    const res = await api.post('/wire-recipients', recipientData);
    set((state) => ({ recipients: [res.data, ...state.recipients] }));
    return res.data;
  },

  removeRecipient: async (id) => {
    await api.delete(`/wire-recipients/${id}`);
    set((state) => ({
      recipients: state.recipients.filter((r) => r._id !== id && r.id !== id),
      selectedRecipient:
        (state.selectedRecipient?._id === id || state.selectedRecipient?.id === id)
          ? null
          : state.selectedRecipient,
    }));
  },

  // Selecting a new recipient resets all downstream wire state
  setSelectedRecipient:   (recipient) => set({
    selectedRecipient: recipient,
    selectedFromAccount: null,
    amount: '',
    memo: '',
    wireResult: null,
  }),
  setSelectedFromAccount: (account) => set({ selectedFromAccount: account }),
  setAmount:              (amount)  => set({ amount }),
  setMemo:                (memo)    => set({ memo }),
  setWireResult:          (result)  => set({ wireResult: result }),
}));
