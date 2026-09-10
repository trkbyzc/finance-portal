package com.financeportal.service.user;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.Role;
import com.financeportal.repository.UserRepository;
import com.financeportal.service.auth.KeycloakAdminService;
import com.financeportal.service.mapper.user.UserMapper;
import com.financeportal.service.messaging.KafkaProducerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserServiceTest {

    @Mock private UserRepository userRepo;
    @Mock private KafkaProducerService kafkaProducer;
    @Mock private UserMapper userMapper;
    @Mock private KeycloakAdminService keycloakAdminService;

    @InjectMocks private UserService service;

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

    // -------- syncAndCreateUser --------

    @Test
    void syncAndCreate_savesAndSendsKafkaEvent() {
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        UserResponseDto dto = new UserResponseDto();
        when(userMapper.toDto(any(User.class))).thenReturn(dto);

        UserResponseDto result = service.syncAndCreateUser(userId, "newuser", "new@example.com");

        assertNotNull(result);
        verify(userRepo).save(any(User.class));
        verify(kafkaProducer).sendMessage("user-events", userId.toString(), "NEW_USER_CREATED");
    }

    // -------- syncRoleFromKeycloak --------

    @Test
    void syncRole_userMissing_doesNothing() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());

        service.syncRoleFromKeycloak(userId, true);

        verify(userRepo, never()).save(any());
    }

    @Test
    void syncRole_alreadySameRole_noOp() {
        user.setRole(Role.USER);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.syncRoleFromKeycloak(userId, false);

        verify(userRepo, never()).save(any());
    }

    @Test
    void syncRole_promoteToAdmin() {
        user.setRole(Role.USER);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.syncRoleFromKeycloak(userId, true);

        assertEquals(Role.ADMIN, user.getRole());
        verify(userRepo).save(user);
    }

    @Test
    void syncRole_demoteFromAdmin() {
        user.setRole(Role.ADMIN);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.syncRoleFromKeycloak(userId, false);

        assertEquals(Role.USER, user.getRole());
        verify(userRepo).save(user);
    }

    // -------- getAllUsers --------

    @Test
    void getAllUsers_mapsEachToDto() {
        User u2 = new User();
        u2.setId(UUID.randomUUID());
        u2.setUsername("bob");

        when(userRepo.findAll()).thenReturn(List.of(user, u2));
        UserResponseDto dto1 = new UserResponseDto();
        UserResponseDto dto2 = new UserResponseDto();
        when(userMapper.toDto(user)).thenReturn(dto1);
        when(userMapper.toDto(u2)).thenReturn(dto2);

        List<UserResponseDto> result = service.getAllUsers();

        assertEquals(2, result.size());
    }

    @Test
    void getAllUsers_empty_returnsEmpty() {
        when(userRepo.findAll()).thenReturn(List.of());
        assertTrue(service.getAllUsers().isEmpty());
    }

    // -------- getUserById --------

    @Test
    void getUserById_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getUserById(userId));
    }

    @Test
    void getUserById_validUser_returnsDto() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        UserResponseDto dto = new UserResponseDto();
        when(userMapper.toDto(user)).thenReturn(dto);

        assertSame(dto, service.getUserById(userId));
    }

    // -------- deleteUser --------

    @Test
    void deleteUser_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.deleteUser(userId));
    }

    @Test
    void deleteUser_existing_deletes() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.deleteUser(userId);

        verify(userRepo).delete(user);
    }

    // ============================================================
    // changePassword
    // ============================================================

    @Test
    void changePassword_basarili_durumda_Keycloak_setPassword_cagrilir() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(keycloakAdminService.verifyPassword(user.getUsername(), "oldpass1")).thenReturn(true);

        service.changePassword(userId, "oldpass1", "newpass123");

        verify(keycloakAdminService).verifyPassword(user.getUsername(), "oldpass1");
        verify(keycloakAdminService).setPassword(userId.toString(), "newpass123");
    }

    @Test
    void changePassword_yanlis_eski_sifre_IllegalArgument() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(keycloakAdminService.verifyPassword(any(), any())).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(userId, "wrongold", "newpass123"));
        assertTrue(ex.getMessage().toLowerCase().contains("mevcut"));
        verify(keycloakAdminService, never()).setPassword(any(), any());
    }

    @Test
    void changePassword_yeni_sifre_kisaysa_IllegalArgument() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(userId, "oldpass1", "kisa1"));
        assertTrue(ex.getMessage().contains("8"));
        verify(keycloakAdminService, never()).verifyPassword(any(), any());
        verify(keycloakAdminService, never()).setPassword(any(), any());
    }

    @Test
    void changePassword_eski_bos_IllegalArgument() {
        assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(userId, "  ", "newpass123"));
        verify(keycloakAdminService, never()).verifyPassword(any(), any());
    }

    @Test
    void changePassword_yeni_eski_ile_ayni_IllegalArgument() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(userId, "samepass1", "samepass1"));
        assertTrue(ex.getMessage().toLowerCase().contains("ayn"));
        verify(keycloakAdminService, never()).verifyPassword(any(), any());
    }

    @Test
    void changePassword_kullanici_yoksa_ResourceNotFound() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.changePassword(userId, "oldpass1", "newpass123"));
        verify(keycloakAdminService, never()).verifyPassword(any(), any());
    }
}
