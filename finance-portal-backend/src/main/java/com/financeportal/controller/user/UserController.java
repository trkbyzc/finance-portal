package com.financeportal.controller.user;

import com.financeportal.model.dto.common.EnabledResponseDto;
import com.financeportal.model.dto.common.MessageResponseDto;
import com.financeportal.model.dto.user.ChangePasswordRequestDto;
import com.financeportal.model.dto.user.Toggle2FAResponseDto;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.service.auth.KeycloakAdminService;
import com.financeportal.service.user.UserService;
import com.financeportal.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Kullanıcı Yönetimi", description = "Profil, üyelik ve 2FA işlemleri")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;
    private final KeycloakAdminService keycloakAdminService;

    @GetMapping("/me")
    @Operation(summary = "Kendi Profil Bilgilerimi Getir")
    public ResponseEntity<UserResponseDto> getMyProfile() {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @GetMapping
    @Operation(summary = "Tüm Kullanıcıları Listele (Admin)")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // 2FA durumu Keycloak'ta tutulur (DB'de değil). Buradaki endpoint'ler ince proxy.

    @GetMapping("/me/2fa")
    @Operation(summary = "2FA Durumum",
            description = "Kullanıcının Keycloak'ta kayıtlı OTP credential'ı var mı kontrol eder.")
    public ResponseEntity<EnabledResponseDto> get2FAStatus() {
        UUID userId = securityUtils.getCurrentUserId();
        boolean enabled = keycloakAdminService.is2FAEnabled(userId.toString());
        return ResponseEntity.ok(EnabledResponseDto.of(enabled));
    }

    @PutMapping("/me/2fa")
    @Operation(summary = "2FA Aç/Kapat",
            description = "Tercihler sayfasından çağrılır. enabled=true → bir sonraki login'de CONFIGURE_TOTP istenir; false → mevcut OTP credential'ları silinir.")
    public ResponseEntity<Toggle2FAResponseDto> toggle2FA(@RequestParam boolean enabled) {
        UUID userId = securityUtils.getCurrentUserId();
        if (enabled) {
            keycloakAdminService.enable2FA(userId.toString());
        } else {
            keycloakAdminService.disable2FA(userId.toString());
        }
        boolean nowEnabled = keycloakAdminService.is2FAEnabled(userId.toString());
        return ResponseEntity.ok(Toggle2FAResponseDto.builder()
                .enabled(nowEnabled)
                .message(enabled
                        ? "2FA bir sonraki girişte kurulması istenecek."
                        : "2FA devre dışı bırakıldı.")
                .build());
    }

    @GetMapping("/me/email-notifications")
    @Operation(summary = "E-posta Bildirim Durumum")
    public ResponseEntity<EnabledResponseDto> getEmailNotifications() {
        UUID userId = securityUtils.getCurrentUserId();
        boolean enabled = userService.isEmailNotificationsEnabled(userId);
        return ResponseEntity.ok(EnabledResponseDto.of(enabled));
    }

    @PutMapping("/me/email-notifications")
    @Operation(summary = "E-posta Bildirimini Aç/Kapat")
    public ResponseEntity<EnabledResponseDto> setEmailNotifications(@RequestParam boolean enabled) {
        UUID userId = securityUtils.getCurrentUserId();
        userService.setEmailNotificationsEnabled(userId, enabled);
        return ResponseEntity.ok(EnabledResponseDto.of(enabled));
    }

    @PostMapping("/me/password")
    @Operation(summary = "Şifremi Değiştir",
            description = "Mevcut şifre doğrulanır, doğruysa yeni şifre Keycloak'ta set edilir.")
    public ResponseEntity<MessageResponseDto> changePassword(@RequestBody ChangePasswordRequestDto req) {
        UUID userId = securityUtils.getCurrentUserId();
        userService.changePassword(userId, req.getOldPassword(), req.getNewPassword());
        return ResponseEntity.ok(MessageResponseDto.of("Şifre güncellendi."));
    }
}
