import { api } from './api.js';

export const supportService = {
  startConversation: (payload = {}) =>
    api.post('/support/conversations', payload),

  addMessage: (conversationId, message) =>
    api.post(`/support/conversations/${conversationId}/message`, { message }),

  getMyConversations: () =>
    api.get('/support/conversations'),

  getConversationMessages: (conversationId) =>
    api.get(`/support/conversations/${conversationId}/messages`),
};
