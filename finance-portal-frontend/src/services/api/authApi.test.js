import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
    default: { post: vi.fn() },
}));

import axios from 'axios';
import { exchangeCodeForToken, refreshAccessToken } from './authApi';

beforeEach(() => {
    axios.post.mockReset();
});

describe('authApi', () => {
    it('exchangeCodeForToken → URLSearchParams ile POST', async () => {
        axios.post.mockResolvedValue({ data: { access_token: 'A', refresh_token: 'R' } });
        const out = await exchangeCodeForToken('CODE123');
        expect(out).toEqual({ access_token: 'A', refresh_token: 'R' });
        expect(axios.post).toHaveBeenCalled();
        const [url, params, opts] = axios.post.mock.calls[0];
        expect(url).toMatch(/openid-connect\/token/);
        const body = params.toString();
        expect(body).toContain('grant_type=authorization_code');
        expect(body).toContain('code=CODE123');
        expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    it('exchangeCodeForToken hata → response.data fırlatılır', async () => {
        axios.post.mockRejectedValue({ response: { data: { error: 'invalid_grant' } } });
        await expect(exchangeCodeForToken('X')).rejects.toEqual({ error: 'invalid_grant' });
    });

    it('exchangeCodeForToken hata response yok → message fırlatılır', async () => {
        axios.post.mockRejectedValue({ message: 'network' });
        await expect(exchangeCodeForToken('X')).rejects.toBe('network');
    });

    it('refreshAccessToken → grant_type=refresh_token', async () => {
        axios.post.mockResolvedValue({ data: { access_token: 'A2' } });
        const out = await refreshAccessToken('RT');
        expect(out.access_token).toBe('A2');
        const body = axios.post.mock.calls[0][1].toString();
        expect(body).toContain('grant_type=refresh_token');
        expect(body).toContain('refresh_token=RT');
    });

    it('refreshAccessToken hata → response.data fırlatılır', async () => {
        axios.post.mockRejectedValue({ response: { data: { error: 'invalid_refresh' } } });
        await expect(refreshAccessToken('RT')).rejects.toEqual({ error: 'invalid_refresh' });
    });
});
