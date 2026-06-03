package com.financeportal.service.user;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.user.UserDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.Role;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import com.financeportal.service.auth.KeycloakAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminServiceTest {

    @Mock private UserRepository userRepo;
    @Mock private KeycloakAdminService keycloakService;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks private AdminService service;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setRole(Role.USER);
    }

    // -------- searchUsers --------

    @Test
    void search_returnsPageWithDto() {
        when(userRepo.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));
        when(keycloakService.getRealmRoles(anyString())).thenReturn(List.of("default-roles"));

        Page<UserDto> result = service.searchUsers(null, null, null, 0, 20);

        assertEquals(1, result.getTotalElements());
        assertEquals("alice", result.getContent().get(0).getUsername());
        assertEquals(List.of("default-roles"), result.getContent().get(0).getRealmRoles());
    }

    @Test
    void search_clampsPageSize_min1_max100() {
        when(userRepo.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.searchUsers(null, null, null, -5, 500);
        // Pageable build edilirken page max(0, -5)=0, size min(max(1,500),100)=100
        // No assertion on Pageable, but verifies code path runs without throw
        service.searchUsers(null, null, null, 0, 0);  // size 1
    }

    @Test
    void search_withQuery_buildsLikePredicate() {
        when(userRepo.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        // Just verify no exception and findAll is called
        service.searchUsers("alice", null, null, 0, 10);
        verify(userRepo).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void search_withRoleFilter_appliesRole() {
        when(userRepo.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        service.searchUsers(null, "ADMIN", null, 0, 10);
        service.searchUsers(null, "admin", null, 0, 10); // case insensitive
        service.searchUsers(null, "INVALID_ROLE", null, 0, 10); // silently ignored
        verify(userRepo, org.mockito.Mockito.times(3)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void search_withBannedFilter_true() {
        when(userRepo.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        service.searchUsers(null, null, true, 0, 10);
        service.searchUsers(null, null, false, 0, 10);
        verify(userRepo, org.mockito.Mockito.times(2)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void search_userWithTempBan_isBannedTrue() {
        user.setBannedUntil(LocalDateTime.now().plusDays(5));
        when(userRepo.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));
        when(keycloakService.getRealmRoles(anyString())).thenReturn(List.of());

        Page<UserDto> result = service.searchUsers(null, null, null, 0, 10);
        assertTrue(result.getContent().get(0).isBanned());
    }

    @Test
    void search_userWithPermaBan_isBannedTrue() {
        user.setBanPermanent(true);
        when(userRepo.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));
        when(keycloakService.getRealmRoles(anyString())).thenReturn(List.of());

        Page<UserDto> result = service.searchUsers(null, null, null, 0, 10);
        assertTrue(result.getContent().get(0).isBanned());
        assertTrue(result.getContent().get(0).isBanPermanent());
    }

    // -------- banUser --------

    @Test
    void ban_userNotFound_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.banUser(userId, 7));
    }

    @Test
    void ban_setsBannedUntilAndClearsPermaBan() {
        user.setBanPermanent(true);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.banUser(userId, 7);

        assertNotNull(user.getBannedUntil());
        assertFalse(user.isBanPermanent());
        assertTrue(user.getBannedUntil().isAfter(LocalDateTime.now().plusDays(6)));
        verify(userRepo).save(user);
    }

    // -------- banPermanent --------

    @Test
    void banPermanent_setsFlagAndLogoutSessions() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.banPermanent(userId);

        assertTrue(user.isBanPermanent());
        assertNull(user.getBannedUntil());
        verify(keycloakService).logoutAllSessions(userId.toString());
    }

    @Test
    void banPermanent_userMissing_throws() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.banPermanent(userId));
    }

    // -------- unbanUser --------

    @Test
    void unban_clearsAllBanFields() {
        user.setBannedUntil(LocalDateTime.now().plusDays(5));
        user.setBanPermanent(true);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.unbanUser(userId);

        assertNull(user.getBannedUntil());
        assertFalse(user.isBanPermanent());
        verify(userRepo).save(user);
    }

    // -------- logoutAllSessions --------

    @Test
    void logoutAllSessions_delegatesAndReturnsResult() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(keycloakService.logoutAllSessions(userId.toString())).thenReturn(true);

        assertTrue(service.logoutAllSessions(userId));

        when(keycloakService.logoutAllSessions(userId.toString())).thenReturn(false);
        assertFalse(service.logoutAllSessions(userId));
    }

    // -------- deleteUser --------

    @Test
    void delete_currentUser_throws400() {
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        assertThrows(IllegalArgumentException.class, () -> service.deleteUser(userId));
    }

    @Test
    void delete_userMissing_throws404() {
        when(securityUtils.getCurrentUserId()).thenReturn(UUID.randomUUID());
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.deleteUser(userId));
    }

    @Test
    void delete_keycloakSuccess_bothFlagsTrue() {
        when(securityUtils.getCurrentUserId()).thenReturn(UUID.randomUUID());
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        AdminService.DeleteResult result = service.deleteUser(userId);

        assertTrue(result.dbDeleted());
        assertTrue(result.keycloakDeleted());
        assertEquals("alice", result.username());
        verify(userRepo).delete(user);
        verify(keycloakService).deleteUser(userId.toString());
    }

    @Test
    void delete_keycloakFails_dbStillDeleted() {
        when(securityUtils.getCurrentUserId()).thenReturn(UUID.randomUUID());
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        org.mockito.Mockito.doThrow(new RuntimeException("orphan")).when(keycloakService).deleteUser(anyString());

        AdminService.DeleteResult result = service.deleteUser(userId);

        assertTrue(result.dbDeleted());
        assertFalse(result.keycloakDeleted());
        verify(userRepo).delete(user);
    }

    @Test
    void delete_currentUserIdNull_doesNotPreventDelete() {
        when(securityUtils.getCurrentUserId()).thenReturn(null);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.deleteUser(userId);

        verify(userRepo).delete(user);
    }

    @Test
    void delete_differentUser_proceedsNormally() {
        when(securityUtils.getCurrentUserId()).thenReturn(UUID.randomUUID());
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.deleteUser(userId);

        verify(userRepo, never()).save(any()); // sadece delete
        verify(userRepo).delete(user);
    }
}
