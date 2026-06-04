import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/apiClient', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import { alarmApi } from './alarmApi';
import { apiClient } from '../../config/apiClient';

describe('alarmApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('listMine → GET /alarms', async () => {
        apiClient.get.mockResolvedValue([{ id: 'a1' }]);
        const r = await alarmApi.listMine();
        expect(apiClient.get).toHaveBeenCalledWith('/alarms');
        expect(r).toHaveLength(1);
    });

    it('create → POST /alarms with payload', async () => {
        const payload = { symbol: 'BTC', assetType: 'CRYPTO', condition: 'ABOVE', threshold: 70000 };
        apiClient.post.mockResolvedValue({ id: 'new-id' });
        await alarmApi.create(payload);
        expect(apiClient.post).toHaveBeenCalledWith('/alarms', payload);
    });

    it('setActive → PUT /alarms/{id}/active?active=true', async () => {
        apiClient.put.mockResolvedValue({ active: true });
        await alarmApi.setActive('uuid-x', true);
        expect(apiClient.put).toHaveBeenCalledWith('/alarms/uuid-x/active', null, { params: { active: true } });
    });

    it('setActive false geçerse de aynı şekilde param verir', async () => {
        apiClient.put.mockResolvedValue({ active: false });
        await alarmApi.setActive('uuid-y', false);
        expect(apiClient.put).toHaveBeenCalledWith('/alarms/uuid-y/active', null, { params: { active: false } });
    });

    it('remove → DELETE /alarms/{id}', async () => {
        apiClient.delete.mockResolvedValue({});
        await alarmApi.remove('uuid-z');
        expect(apiClient.delete).toHaveBeenCalledWith('/alarms/uuid-z');
    });
});
