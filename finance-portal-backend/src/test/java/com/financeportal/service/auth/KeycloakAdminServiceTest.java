package com.financeportal.service.auth;

import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleMappingResource;
import org.keycloak.admin.client.resource.RoleScopeResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class KeycloakAdminServiceTest {

    @Mock private Keycloak keycloak;
    @Mock private RealmResource realmResource;
    @Mock private UsersResource usersResource;
    @Mock private UserResource userResource;
    @Mock private Response response;
    @Mock private RoleMappingResource roleMappingResource;
    @Mock private RoleScopeResource roleScopeResource;

    private KeycloakAdminService service;

    @BeforeEach
    void setUp() {
        service = new KeycloakAdminService();
        ReflectionTestUtils.setField(service, "keycloakServerUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(service, "realm", "finance-realm");
        ReflectionTestUtils.setField(service, "adminUsername", "admin");
        ReflectionTestUtils.setField(service, "adminPassword", "admin");
        ReflectionTestUtils.setField(service, "adminClientId", "admin-cli");
        ReflectionTestUtils.setField(service, "keycloak", keycloak);
        when(keycloak.realm("finance-realm")).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
    }

    @Test
    void getRealm_returnsField() {
        assertEquals("finance-realm", service.getRealm());
    }

    @Test
    void getKeycloak_returnsField() {
        assertSame(keycloak, service.getKeycloak());
    }

    @Test
    void generateOTPCredential_buildsSecretAndQrUrl() {
        Map<String, String> result = service.generateOTPCredential("alice");
        assertNotNull(result.get("secret"));
        assertTrue(result.get("qrCodeUrl").contains("alice"));
        assertTrue(result.get("qrCodeUrl").startsWith("otpauth://totp/FinancePortal:"));
        // Base32 doesn't include = padding
        assertFalse(result.get("secret").contains("="));
    }

    @Test
    void createUser_existing_returnsExistingId() {
        UserRepresentation existing = new UserRepresentation();
        existing.setId("existing-id");
        when(usersResource.search("alice", true)).thenReturn(List.of(existing));

        String id = service.createUser("alice", "a@x", "pw", "A", "L");

        assertEquals("existing-id", id);
    }

    @Test
    void createUser_success_returnsExtractedId() {
        when(usersResource.search("bob", true)).thenReturn(List.of());
        when(usersResource.create(org.mockito.ArgumentMatchers.any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(201);
        when(response.getLocation()).thenReturn(URI.create("http://localhost:8080/admin/realms/finance-realm/users/new-user-id"));
        // stub for enable2FA inside create
        when(usersResource.get("new-user-id")).thenReturn(userResource);
        UserRepresentation kcUser = new UserRepresentation();
        kcUser.setId("new-user-id");
        when(userResource.toRepresentation()).thenReturn(kcUser);

        String id = service.createUser("bob", "b@x", "pw", "B", "L");

        assertEquals("new-user-id", id);
        verify(response).close();
    }

    @Test
    void createUser_failureStatus_throws() {
        when(usersResource.search("err", true)).thenReturn(List.of());
        when(usersResource.create(org.mockito.ArgumentMatchers.any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(500);
        when(response.readEntity(String.class)).thenReturn("boom");

        assertThrows(RuntimeException.class, () -> service.createUser("err", "e@x", "pw", "E", "L"));
    }

    @Test
    void enable2FA_success() {
        when(usersResource.get("uid")).thenReturn(userResource);
        UserRepresentation kcUser = new UserRepresentation();
        when(userResource.toRepresentation()).thenReturn(kcUser);

        service.enable2FA("uid");

        verify(userResource).update(kcUser);
        assertEquals(List.of("CONFIGURE_TOTP"), kcUser.getRequiredActions());
    }

    @Test
    void enable2FA_throwsWraps() {
        when(usersResource.get("uid")).thenThrow(new RuntimeException("kc down"));

        assertThrows(RuntimeException.class, () -> service.enable2FA("uid"));
    }

    // -------- disable2FA + is2FAEnabled --------

    @Test
    void disable2FA_removesOtpCredentialsAndRequiredAction() {
        org.keycloak.admin.client.resource.UserResource ur = userResource;
        when(usersResource.get("uid")).thenReturn(ur);
        org.keycloak.representations.idm.CredentialRepresentation otp = new org.keycloak.representations.idm.CredentialRepresentation();
        otp.setId("c1"); otp.setType("otp");
        org.keycloak.representations.idm.CredentialRepresentation pwd = new org.keycloak.representations.idm.CredentialRepresentation();
        pwd.setId("c2"); pwd.setType("password");
        when(ur.credentials()).thenReturn(java.util.List.of(otp, pwd));
        UserRepresentation kcUser = new UserRepresentation();
        kcUser.setRequiredActions(new java.util.ArrayList<>(java.util.List.of("CONFIGURE_TOTP", "VERIFY_EMAIL")));
        when(ur.toRepresentation()).thenReturn(kcUser);

        service.disable2FA("uid");

        verify(ur).removeCredential("c1");
        verify(ur, org.mockito.Mockito.never()).removeCredential("c2");
        verify(ur).update(kcUser);
        assertEquals(List.of("VERIFY_EMAIL"), kcUser.getRequiredActions());
    }

    @Test
    void disable2FA_noOtp_noRequiredAction_passesQuietly() {
        when(usersResource.get("uid")).thenReturn(userResource);
        when(userResource.credentials()).thenReturn(java.util.List.of());
        UserRepresentation kcUser = new UserRepresentation();
        when(userResource.toRepresentation()).thenReturn(kcUser);

        service.disable2FA("uid");

        verify(userResource, org.mockito.Mockito.never()).removeCredential(org.mockito.ArgumentMatchers.anyString());
        verify(userResource, org.mockito.Mockito.never()).update(any(UserRepresentation.class));
    }

    @Test
    void disable2FA_throws_wraps() {
        when(usersResource.get("uid")).thenThrow(new RuntimeException("kc down"));
        assertThrows(RuntimeException.class, () -> service.disable2FA("uid"));
    }

    @Test
    void is2FAEnabled_otpCredentialPresent_returnsTrue() {
        when(usersResource.get("uid")).thenReturn(userResource);
        org.keycloak.representations.idm.CredentialRepresentation otp = new org.keycloak.representations.idm.CredentialRepresentation();
        otp.setType("otp");
        when(userResource.credentials()).thenReturn(java.util.List.of(otp));
        assertTrue(service.is2FAEnabled("uid"));
    }

    @Test
    void is2FAEnabled_noOtp_returnsFalse() {
        when(usersResource.get("uid")).thenReturn(userResource);
        org.keycloak.representations.idm.CredentialRepresentation pwd = new org.keycloak.representations.idm.CredentialRepresentation();
        pwd.setType("password");
        when(userResource.credentials()).thenReturn(java.util.List.of(pwd));
        assertFalse(service.is2FAEnabled("uid"));
    }

    @Test
    void is2FAEnabled_keycloakNull_returnsFalse() {
        ReflectionTestUtils.setField(service, "keycloak", null);
        assertFalse(service.is2FAEnabled("uid"));
    }

    @Test
    void is2FAEnabled_userIdNull_returnsFalse() {
        assertFalse(service.is2FAEnabled(null));
    }

    @Test
    void is2FAEnabled_throws_returnsFalse() {
        when(usersResource.get("uid")).thenThrow(new RuntimeException("403"));
        assertFalse(service.is2FAEnabled("uid"));
    }

    @Test
    void deleteUser_success() {
        service.deleteUser("uid");

        verify(usersResource).delete("uid");
    }

    @Test
    void deleteUser_throwsWraps() {
        org.mockito.Mockito.doThrow(new RuntimeException("404")).when(usersResource).delete("uid");

        assertThrows(RuntimeException.class, () -> service.deleteUser("uid"));
    }

    @Test
    void getUserIdByUsername_found_returnsId() {
        UserRepresentation rep = new UserRepresentation();
        rep.setId("uid-x");
        when(usersResource.search("john", true)).thenReturn(List.of(rep));

        assertEquals("uid-x", service.getUserIdByUsername("john"));
    }

    @Test
    void getUserIdByUsername_empty_returnsNull() {
        when(usersResource.search("ghost", true)).thenReturn(List.of());

        assertNull(service.getUserIdByUsername("ghost"));
    }

    @Test
    void getUserIdByUsername_throws_returnsNull() {
        when(usersResource.search(anyString(), eq(true))).thenThrow(new RuntimeException("boom"));

        assertNull(service.getUserIdByUsername("any"));
    }

    @Test
    void logoutAllSessions_keycloakNull_returnsFalse() {
        ReflectionTestUtils.setField(service, "keycloak", null);

        assertFalse(service.logoutAllSessions("uid"));
    }

    @Test
    void logoutAllSessions_userIdNull_returnsFalse() {
        assertFalse(service.logoutAllSessions(null));
    }

    @Test
    void logoutAllSessions_success_returnsTrue() {
        when(usersResource.get("uid")).thenReturn(userResource);

        assertTrue(service.logoutAllSessions("uid"));

        verify(userResource).logout();
    }

    @Test
    void logoutAllSessions_throws_returnsFalse() {
        when(usersResource.get("uid")).thenThrow(new RuntimeException("kc down"));

        assertFalse(service.logoutAllSessions("uid"));
    }

    @Test
    void getRealmRoles_keycloakNull_returnsEmpty() {
        ReflectionTestUtils.setField(service, "keycloak", null);

        assertTrue(service.getRealmRoles("uid").isEmpty());
    }

    @Test
    void getRealmRoles_userIdNull_returnsEmpty() {
        assertTrue(service.getRealmRoles(null).isEmpty());
    }

    @Test
    void getRealmRoles_success_mapsNames() {
        when(usersResource.get("uid")).thenReturn(userResource);
        when(userResource.roles()).thenReturn(roleMappingResource);
        when(roleMappingResource.realmLevel()).thenReturn(roleScopeResource);
        RoleRepresentation r1 = new RoleRepresentation();
        r1.setName("USER");
        RoleRepresentation r2 = new RoleRepresentation();
        r2.setName("ADMIN");
        when(roleScopeResource.listEffective()).thenReturn(List.of(r1, r2));

        List<String> result = service.getRealmRoles("uid");

        assertEquals(List.of("USER", "ADMIN"), result);
    }

    @Test
    void getRealmRoles_throws_returnsEmpty() {
        when(usersResource.get("uid")).thenThrow(new RuntimeException("403"));

        assertTrue(service.getRealmRoles("uid").isEmpty());
    }

    @Test
    void cleanup_closesKeycloak() {
        service.cleanup();
        verify(keycloak).close();
    }

    @Test
    void cleanup_keycloakNull_noOp() {
        ReflectionTestUtils.setField(service, "keycloak", null);
        assertDoesNotThrow(() -> service.cleanup());
    }

    // ============================================================
    // verifyPassword + setPassword (self-service şifre değiştirme)
    // ============================================================

    @Test
    void verifyPassword_dogru_sifre_token_endpoint_200_donerse_true() {
        org.springframework.web.client.RestTemplate rt = org.mockito.Mockito.mock(org.springframework.web.client.RestTemplate.class);
        ReflectionTestUtils.setField(service, "restTemplate", rt);
        ReflectionTestUtils.setField(service, "userClientId", "finance-client");

        when(rt.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(new org.springframework.http.ResponseEntity<>("{\"access_token\":\"x\"}",
                        org.springframework.http.HttpStatus.OK));

        assertTrue(service.verifyPassword("alice", "correctpass"));
    }

    @Test
    void verifyPassword_yanlis_sifre_401_donerse_false() {
        org.springframework.web.client.RestTemplate rt = org.mockito.Mockito.mock(org.springframework.web.client.RestTemplate.class);
        ReflectionTestUtils.setField(service, "restTemplate", rt);
        ReflectionTestUtils.setField(service, "userClientId", "finance-client");

        when(rt.postForEntity(anyString(), any(), eq(String.class)))
                .thenThrow(org.springframework.web.client.HttpClientErrorException.create(
                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                        "invalid_grant", null, null, null));

        assertFalse(service.verifyPassword("alice", "wrongpass"));
    }

    @Test
    void verifyPassword_client_config_hatasi_400_donerse_false() {
        org.springframework.web.client.RestTemplate rt = org.mockito.Mockito.mock(org.springframework.web.client.RestTemplate.class);
        ReflectionTestUtils.setField(service, "restTemplate", rt);
        ReflectionTestUtils.setField(service, "userClientId", "finance-client");

        when(rt.postForEntity(anyString(), any(), eq(String.class)))
                .thenThrow(org.springframework.web.client.HttpClientErrorException.create(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "client config", null,
                        "{\"error\":\"invalid_client\"}".getBytes(), null));

        // 400 ≠ 401 → log'a yazılır ama yine false döner
        assertFalse(service.verifyPassword("alice", "pass"));
    }

    @Test
    void verifyPassword_network_hatasi_false_doner() {
        org.springframework.web.client.RestTemplate rt = org.mockito.Mockito.mock(org.springframework.web.client.RestTemplate.class);
        ReflectionTestUtils.setField(service, "restTemplate", rt);
        ReflectionTestUtils.setField(service, "userClientId", "finance-client");

        when(rt.postForEntity(anyString(), any(), eq(String.class)))
                .thenThrow(new org.springframework.web.client.ResourceAccessException("timeout"));

        assertFalse(service.verifyPassword("alice", "pass"));
    }

    @Test
    void verifyPassword_keycloak_null_false_doner() {
        ReflectionTestUtils.setField(service, "keycloak", null);
        assertFalse(service.verifyPassword("alice", "pass"));
    }

    @Test
    void verifyPassword_username_null_false_doner() {
        assertFalse(service.verifyPassword(null, "pass"));
    }

    @Test
    void verifyPassword_password_null_false_doner() {
        assertFalse(service.verifyPassword("alice", null));
    }

    @Test
    void setPassword_basarili_durumda_userResource_resetPassword_cagrilir() {
        when(usersResource.get("uid-1")).thenReturn(userResource);

        service.setPassword("uid-1", "newpass123");

        org.mockito.ArgumentCaptor<org.keycloak.representations.idm.CredentialRepresentation> capt =
                org.mockito.ArgumentCaptor.forClass(org.keycloak.representations.idm.CredentialRepresentation.class);
        verify(userResource).resetPassword(capt.capture());
        assertEquals(org.keycloak.representations.idm.CredentialRepresentation.PASSWORD, capt.getValue().getType());
        assertEquals("newpass123", capt.getValue().getValue());
        assertFalse(capt.getValue().isTemporary());
    }

    @Test
    void setPassword_keycloak_null_IllegalStateException() {
        ReflectionTestUtils.setField(service, "keycloak", null);
        assertThrows(IllegalStateException.class, () -> service.setPassword("uid", "p"));
    }

    @Test
    void setPassword_Keycloak_API_patlarsa_RuntimeException() {
        when(usersResource.get("uid-bad")).thenReturn(userResource);
        org.mockito.Mockito.doThrow(new RuntimeException("KC 500"))
                .when(userResource).resetPassword(any());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.setPassword("uid-bad", "newpass"));
        assertTrue(ex.getMessage().toLowerCase().contains("şifre") || ex.getMessage().contains("KC 500"));
    }
}
