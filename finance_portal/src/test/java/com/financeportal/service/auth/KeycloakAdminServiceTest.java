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
        Map<String, String> result = service.generateOTPCredential("uid", "alice");
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
        service.cleanup(); // no exception
    }
}
