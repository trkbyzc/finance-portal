package com.financeportal.controller.user;

import com.financeportal.model.dto.common.MessageResponseDto;
import com.financeportal.model.dto.user.AdminActionResponseDto;
import com.financeportal.model.dto.user.DeleteUserResponseDto;
import com.financeportal.model.dto.user.UserDto;
import com.financeportal.service.user.AdminService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock private AdminService adminService;

    @InjectMocks private AdminController controller;

    @Test
    void getAllUsers_delegatesToService_andReturns200() {
        Page<UserDto> page = new PageImpl<>(List.of(UserDto.builder().username("alice").build()));
        when(adminService.searchUsers("alice", "USER", true, 0, 20)).thenReturn(page);

        ResponseEntity<Page<UserDto>> resp = controller.getAllUsers("alice", "USER", true, 0, 20);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(1, resp.getBody().getTotalElements());
    }

    @Test
    void getAllUsers_nullFilters_passedAsIs() {
        when(adminService.searchUsers(null, null, null, 0, 20)).thenReturn(Page.empty());

        ResponseEntity<Page<UserDto>> resp = controller.getAllUsers(null, null, null, 0, 20);

        assertNotNull(resp.getBody());
        verify(adminService).searchUsers(null, null, null, 0, 20);
    }

    @Test
    void banUser_callsServiceAndReturnsMessage() {
        UUID id = UUID.randomUUID();
        ResponseEntity<MessageResponseDto> resp = controller.banUser(id, 7);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().getMessage().contains("7"));
        verify(adminService).banUser(id, 7);
    }

    @Test
    void banPermanent_callsServiceAndReturnsMessage() {
        UUID id = UUID.randomUUID();
        ResponseEntity<MessageResponseDto> resp = controller.banPermanent(id);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().getMessage().contains("kalıcı"));
        verify(adminService).banPermanent(id);
    }

    @Test
    void unbanUser_callsServiceAndReturnsMessage() {
        UUID id = UUID.randomUUID();
        ResponseEntity<MessageResponseDto> resp = controller.unbanUser(id);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().getMessage().contains("banı kaldırıldı"));
        verify(adminService).unbanUser(id);
    }

    @Test
    void logoutAll_successTrue_returnsSuccessMessage() {
        UUID id = UUID.randomUUID();
        when(adminService.logoutAllSessions(id)).thenReturn(true);

        ResponseEntity<AdminActionResponseDto> resp = controller.logoutAll(id);

        assertTrue(resp.getBody().isSuccess());
        assertTrue(resp.getBody().getMessage().contains("oturumlar kapatıldı"));
    }

    @Test
    void logoutAll_successFalse_returnsFailureMessage() {
        UUID id = UUID.randomUUID();
        when(adminService.logoutAllSessions(id)).thenReturn(false);

        ResponseEntity<AdminActionResponseDto> resp = controller.logoutAll(id);

        assertFalse(resp.getBody().isSuccess());
        assertTrue(resp.getBody().getMessage().contains("kapatılamadı"));
    }

    @Test
    void deleteUser_keycloakDeletedTrue_includesBothMessage() {
        UUID id = UUID.randomUUID();
        when(adminService.deleteUser(id)).thenReturn(new AdminService.DeleteResult(true, true, "bob"));

        ResponseEntity<DeleteUserResponseDto> resp = controller.deleteUser(id);

        assertTrue(resp.getBody().isSuccess());
        assertTrue(resp.getBody().isKeycloakDeleted());
        assertTrue(resp.getBody().getMessage().contains("hem Keycloak'tan hem DB'den"));
    }

    @Test
    void deleteUser_keycloakDeletedFalse_includesDbOnlyMessage() {
        UUID id = UUID.randomUUID();
        when(adminService.deleteUser(id)).thenReturn(new AdminService.DeleteResult(true, false, "ghost"));

        ResponseEntity<DeleteUserResponseDto> resp = controller.deleteUser(id);

        assertFalse(resp.getBody().isKeycloakDeleted());
        assertTrue(resp.getBody().getMessage().contains("sadece DB'den"));
    }
}
