import { describe, it, expect, beforeEach } from 'vitest';
import { goToRegister, goToLogin } from './keycloak';

describe('keycloak helpers', () => {
    let originalLocation;
    beforeEach(() => {
        // window.location.href setter'ı yakala
        originalLocation = window.location;
        delete window.location;
        window.location = { ...originalLocation, href: '' };
    });

    it('goToRegister → Keycloak registrations URL\'i set eder', () => {
        goToRegister();
        expect(window.location.href).toContain('/realms/finance-realm/protocol/openid-connect/registrations');
        expect(window.location.href).toContain('client_id=finance-client');
        expect(window.location.href).toContain('response_type=code');
        expect(window.location.href).toContain('scope=openid');
    });

    it('goToLogin → Keycloak auth URL\'i set eder', () => {
        goToLogin();
        expect(window.location.href).toContain('/realms/finance-realm/protocol/openid-connect/auth');
        expect(window.location.href).toContain('client_id=finance-client');
    });

    it('redirect_uri auth/callback path\'ini içerir', () => {
        goToLogin();
        expect(window.location.href).toMatch(/redirect_uri=.*auth%2Fcallback|auth\/callback/);
    });
});
