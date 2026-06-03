import { apiClient } from '../../config/apiClient';

/**
 * FinansPortal Chatbot endpoint'leri.
 * Backend: /api/chat
 */
export const chatApi = {
    listConversations: () => apiClient.get('/chat/conversations'),

    getMessages: (conversationId) =>
        apiClient.get(`/chat/conversations/${conversationId}/messages`),

    /**
     * Yeni mesaj gönder.
     * @param {object} payload { conversationId?: uuid, message: string, locale: 'tr'|'en' }
     */
    sendMessage: (payload) => apiClient.post('/chat/messages', payload),

    deleteConversation: (conversationId) =>
        apiClient.delete(`/chat/conversations/${conversationId}`)
};
