package com.financeportal.service.user;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.Role;
import com.financeportal.repository.UserRepository;
import com.financeportal.service.auth.KeycloakAdminService;
import com.financeportal.service.mapper.user.UserMapper;
import com.financeportal.service.messaging.KafkaProducerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final KafkaProducerService kafkaProducerService;
    private final UserMapper userMapper;
    private final KeycloakAdminService keycloakAdminService;

    @Transactional
    public UserResponseDto syncAndCreateUser(UUID userId, String username, String email) {
        log.info("Keycloak senkronizasyonu ile yeni kullanıcı kaydı başlatıldı: {}", username);

        User user = User.createNewUser(userId, username, email);
        userRepository.save(user);

        kafkaProducerService.sendMessage("user-events", user.getId().toString(), "NEW_USER_CREATED");

        log.info("Kullanıcı başarıyla oluşturuldu. ID: {}", user.getId());
        return userMapper.toDto(user);
    }

    /**
     * Keycloak realm rollerine göre DB role alanını günceller. Sadece gerçekten
     * değişen kullanıcılar için DB'ye yazar (idempotent).
     *
     * @param userId         JWT 'sub' UUID
     * @param isKeycloakAdmin JWT realm_access.roles içinde "ADMIN" var mı
     */
    @Transactional
    public void syncRoleFromKeycloak(UUID userId, boolean isKeycloakAdmin) {
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return;
        User user = opt.get();
        Role desired = isKeycloakAdmin ? Role.ADMIN : Role.USER;
        if (user.getRole() == desired) return;
        log.info("[USER-SYNC] {} kullanıcısının rolü {} → {} olarak senkronize edildi (Keycloak source-of-truth).",
                user.getUsername(), user.getRole(), desired);
        user.setRole(desired);
        userRepository.save(user);
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .toList();
    }

    public UserResponseDto getUserById(UUID id) {
        return userMapper.toDto(findUserEntityById(id));
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = findUserEntityById(id);
        userRepository.delete(user);
    }

    /** Kullanıcının e-posta bildirim tercihi (default true). */
    public boolean isEmailNotificationsEnabled(UUID userId) {
        return userRepository.findById(userId)
                .map(User::isEmailNotificationsEnabled)
                .orElse(false);
    }

    /** Tercihler sayfasından çağrılır — e-posta bildirimini aç/kapat. */
    @Transactional
    public void setEmailNotificationsEnabled(UUID userId, boolean enabled) {
        User user = findUserEntityById(userId);
        user.setEmailNotificationsEnabled(enabled);
        userRepository.save(user);
        log.info("[USER] {} e-posta bildirimi {} olarak güncellendi.", user.getUsername(), enabled);
    }

    /**
     * Kullanıcının şifresini değiştirir. Önce eski şifreyi Keycloak token endpoint'inde
     * doğrular (verifyPassword), doğruysa Admin API ile yenisini set eder.
     *
     * Validasyon kuralları:
     *  - yeni şifre min 8 karakter
     *  - yeni == eski olmamalı
     *
     * Hata mesajları kullanıcıya yansıtılır (IllegalArgumentException).
     */
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        if (oldPassword == null || oldPassword.isBlank()) {
            throw new IllegalArgumentException("Mevcut şifre boş olamaz.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Yeni şifre en az 8 karakter olmalı.");
        }
        if (newPassword.equals(oldPassword)) {
            throw new IllegalArgumentException("Yeni şifre eskisiyle aynı olamaz.");
        }

        User user = findUserEntityById(userId);
        String username = user.getUsername();

        // 1) Eski şifre doğru mu?
        if (!keycloakAdminService.verifyPassword(username, oldPassword)) {
            throw new IllegalArgumentException("Mevcut şifre yanlış.");
        }

        // 2) Keycloak user id'si (DB userId = JWT sub = Keycloak user id)
        keycloakAdminService.setPassword(userId.toString(), newPassword);
        log.info("[USER] {} şifresini değiştirdi.", username);
    }

    private User findUserEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));
    }
}
