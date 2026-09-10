import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tokenManager } from './tokenManager';

describe('tokenManager', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    describe('access token', () => {
        it('setAccessToken yazar, getAccessToken okur', () => {
            tokenManager.setAccessToken('abc');
            expect(tokenManager.getAccessToken()).toBe('abc');
        });

        it('falsy token kabul edilmez (yazmaz)', () => {
            tokenManager.setAccessToken('');
            tokenManager.setAccessToken(null);
            tokenManager.setAccessToken(undefined);
            expect(tokenManager.getAccessToken()).toBeNull();
        });

        it('sessionStorage fallback', () => {
            sessionStorage.setItem('access_token', 'sess-token');
            expect(tokenManager.getAccessToken()).toBe('sess-token');
        });

        it('localStorage öncelikli', () => {
            sessionStorage.setItem('access_token', 'sess');
            localStorage.setItem('access_token', 'local');
            expect(tokenManager.getAccessToken()).toBe('local');
        });
    });

    describe('refresh token', () => {
        it('setRefreshToken + getRefreshToken', () => {
            tokenManager.setRefreshToken('rfx');
            expect(tokenManager.getRefreshToken()).toBe('rfx');
        });
    });

    describe('setTokens', () => {
        it('her ikisini yazar', () => {
            tokenManager.setTokens('a', 'r');
            expect(tokenManager.getAccessToken()).toBe('a');
            expect(tokenManager.getRefreshToken()).toBe('r');
        });
    });

    describe('clearTokens', () => {
        it("localStorage ve sessionStorage'ı temizler", () => {
            localStorage.setItem('access_token', 'la');
            sessionStorage.setItem('access_token', 'sa');
            localStorage.setItem('refresh_token', 'lr');
            sessionStorage.setItem('refresh_token', 'sr');

            tokenManager.clearTokens();

            expect(tokenManager.getAccessToken()).toBeNull();
            expect(tokenManager.getRefreshToken()).toBeNull();
        });
    });

    describe('hasToken', () => {
        it('token yoksa false', () => expect(tokenManager.hasToken()).toBe(false));
        it('token varsa true', () => {
            tokenManager.setAccessToken('x');
            expect(tokenManager.hasToken()).toBe(true);
        });
    });

    describe('decodeToken', () => {
        it('geçersiz token → null (error log)', () => {
            const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            expect(tokenManager.decodeToken('not-a-jwt')).toBeNull();
            expect(errSpy).toHaveBeenCalled();
            errSpy.mockRestore();
        });

        it('geçerli JWT payload döner', () => {
            // header.payload.sig — payload = {sub:"alice", exp:9999999999}
            const payload = btoa(JSON.stringify({ sub: 'alice', exp: 9999999999 }));
            const token = `header.${payload}.sig`;
            const decoded = tokenManager.decodeToken(token);
            expect(decoded.sub).toBe('alice');
            expect(decoded.exp).toBe(9999999999);
        });
    });

    describe('isTokenExpired', () => {
        it('geçersiz token → true (güvenli)', () => {
            const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            expect(tokenManager.isTokenExpired('bad')).toBe(true);
            errSpy.mockRestore();
        });

        it('exp gelecekte → false', () => {
            const payload = btoa(JSON.stringify({ exp: 9999999999 }));
            expect(tokenManager.isTokenExpired(`h.${payload}.s`)).toBe(false);
        });

        it('exp geçmişte → true', () => {
            const payload = btoa(JSON.stringify({ exp: 1 }));
            expect(tokenManager.isTokenExpired(`h.${payload}.s`)).toBe(true);
        });
    });

    describe('getTokenExpiresIn', () => {
        it('geçersiz token → 0', () => {
            const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            expect(tokenManager.getTokenExpiresIn('bad')).toBe(0);
            errSpy.mockRestore();
        });

        it('exp gelecekte → pozitif saniye', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const payload = btoa(JSON.stringify({ exp }));
            const result = tokenManager.getTokenExpiresIn(`h.${payload}.s`);
            expect(result).toBeGreaterThan(3500);
            expect(result).toBeLessThanOrEqual(3600);
        });

        it('exp geçmişte → 0', () => {
            const payload = btoa(JSON.stringify({ exp: 1 }));
            expect(tokenManager.getTokenExpiresIn(`h.${payload}.s`)).toBe(0);
        });
    });
});
