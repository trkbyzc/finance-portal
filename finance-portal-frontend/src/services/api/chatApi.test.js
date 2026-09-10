import { describe, it, expect, vi, beforeEach } from 'vitest';

// chatApi apiClient'a (axios) bağlıdır; apiClient'in interceptor'u response.data unwrap eder.
// Mock'u tepedeki module-level vi.mock ile statik tanımlıyoruz ki chatApi import'unda
// hazır olsun.
vi.mock('../../config/apiClient', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

import { chatApi } from './chatApi';
import { apiClient } from '../../config/apiClient';

describe('chatApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('listConversations → GET /chat/conversations', async () => {
        apiClient.get.mockResolvedValue([{ id: 'c1', title: 'X' }]);
        const r = await chatApi.listConversations();
        expect(apiClient.get).toHaveBeenCalledWith('/chat/conversations');
        expect(r).toEqual([{ id: 'c1', title: 'X' }]);
    });

    it('getMessages → GET /chat/conversations/{id}/messages', async () => {
        apiClient.get.mockResolvedValue([]);
        await chatApi.getMessages('abc-123');
        expect(apiClient.get).toHaveBeenCalledWith('/chat/conversations/abc-123/messages');
    });

    it('sendMessage → POST /chat/messages with payload', async () => {
        apiClient.post.mockResolvedValue({ conversationId: 'c1', message: { content: 'hi' } });
        const payload = { conversationId: null, message: 'selam', locale: 'tr' };
        const r = await chatApi.sendMessage(payload);
        expect(apiClient.post).toHaveBeenCalledWith('/chat/messages', payload);
        expect(r.message.content).toBe('hi');
    });

    it('deleteConversation → DELETE /chat/conversations/{id}', async () => {
        apiClient.delete.mockResolvedValue({ message: 'Sohbet silindi.' });
        await chatApi.deleteConversation('uuid-1');
        expect(apiClient.delete).toHaveBeenCalledWith('/chat/conversations/uuid-1');
    });

    it('hata mesajını yutar — reject reject olarak iletilir', async () => {
        const err = { response: { status: 503, data: { message: 'down' } } };
        apiClient.post.mockRejectedValue(err);
        await expect(chatApi.sendMessage({ message: 'x' })).rejects.toBe(err);
    });
});
