package com.financeportal.controller.user;

import com.financeportal.model.dto.common.EnabledResponseDto;
import com.financeportal.model.dto.user.Toggle2FAResponseDto;
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

        ResponseEntity<EnabledResponseDto> resp = controller.get2FAStatus();

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().isEnabled());
    }

    @Test
    void get2FAStatus_disabled_returnsFalse() {
        when(keycloakAdminService.is2FAEnabled(userId.toString())).thenReturn(false);

        ResponseEntity<EnabledResponseDto> resp = controller.get2FAStatus();

        assertFalse(resp.getBody().isEnabled());
    }

    @Test
    void toggle2FA_enable_callsEnable() {
        when(keycloakAdminService.is2FAEnabled(userId.toString())).thenReturn(false);

        ResponseEntity<Toggle2FAResponseDto> resp = controller.toggle2FA(true);

        verify(keycloakAdminService).enable2FA(userId.toString());
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody().getMessage());
    }

    @Test
    void toggle2FA_disable_callsDisable() {
        when(keycloakAdminService.is2FAEnabled(userId.toString())).thenReturn(false);

        ResponseEntity<Toggle2FAResponseDto> resp = controller.toggle2FA(false);

        verify(keycloakAdminService).disable2FA(userId.toString());
        assertFalse(resp.getBody().isEnabled());
    }

    @Test
    void getEmailNotifications_returnsServiceFlag() {
        when(userService.isEmailNotificationsEnabled(userId)).thenReturn(true);

        ResponseEntity<EnabledResponseDto> resp = controller.getEmailNotifications();

        assertTrue(resp.getBody().isEnabled());
    }

    @Test
    void setEmailNotifications_passesFlagToService() {
        ResponseEntity<EnabledResponseDto> resp = controller.setEmailNotifications(false);

        verify(userService).setEmailNotificationsEnabled(userId, false);
        assertFalse(resp.getBody().isEnabled());
    }
}
