import { api } from './api';

export const transferService = {
  internalTransfer: (fromAccountId, toAccountId, amount) =>
    api.post('/transfers/internal', { fromAccountId, toAccountId, amount }),
};
