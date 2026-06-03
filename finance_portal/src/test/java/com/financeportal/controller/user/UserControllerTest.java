package com.financeportal.controller.user;

import com.financeportal.security.SecurityUtils;
import com.financeportal.service.auth.KeycloakAdminService;
import com.financeportal.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock private UserService userService;
    @Mock private SecurityUtils securityUtils;
    @Mock private KeycloakAdminService keycloakAdminService;

    @InjectMocks private UserController controller;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
    }

    @Test
    void get2FAStatus_enabled_returnsTrue() {
        when(keycloakAdminService.is2FAEnabled(userId.toString())).thenReturn(true);

        ResponseEntity<Map<String, Boolean>> resp = controller.get2FAStatus();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(Boolean.TRUE, resp.getBody().get("enabled"));
    }

    @Test
    void get2FAStatus_disabled_returnsFalse() {
        when(keycloakAdminService.is2FAEnabled(userId.toString())).thenReturn(false);

        ResponseEntity<Map<String, Boolean>> resp = controller.get2FAStatus();

        assertEquals(Boolean.FALSE, resp.getBody().get("enabled"));
    }

    @Test
    void toggle2FA_enable_callsEnable() {
        when(keycloakAdminService.is2FAEnabled(userId.toString())).thenReturn(false);

        ResponseEntity<Map<String, Object>> resp = controller.toggle2FA(true);

        verify(keycloakAdminService).enable2FA(userId.toString());
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody().get("message"));
    }

    @Test
    void toggle2FA_disable_callsDisable() {
        when(keycloakAdminService.is2FAEnabled(userId.toString())).thenReturn(false);

        ResponseEntity<Map<String, Object>> resp = controller.toggle2FA(false);

        verify(keycloakAdminService).disable2FA(userId.toString());
        assertEquals(Boolean.FALSE, resp.getBody().get("enabled"));
    }
}
