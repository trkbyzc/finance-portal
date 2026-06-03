package com.financeportal.controller.user;

import com.financeportal.model.dto.user.UserRegistrationDto;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Kullanıcı Yönetimi", description = "Profil, KYC ve Üyelik İşlemleri")
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

    @PostMapping("/kyc")
    @Operation(summary = "Yatırımcı Profilini Belirle (KYC)", description = "Anket sonuçlarına göre risk profilini hesaplar ve kaydeder.")
    public ResponseEntity<Map<String, String>> submitKyc(@RequestBody UserRegistrationDto registrationDto) {
        UUID userId = securityUtils.getCurrentUserId();
        String profileName = userService.processKyc(userId, registrationDto);
        return ResponseEntity.ok(Map.of("message", "Anket tamamlandı. Profiliniz: " + profileName));
    }

    // Admin için listeleme
    @GetMapping
    @Operation(summary = "Tüm Kullanıcıları Listele (Admin)")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // -------- 2FA Yönetimi --------
    // 2FA durumu Keycloak'ta tutulur (DB'de değil). Buradaki endpoint'ler ince proxy.

    @GetMapping("/me/2fa")
    @Operation(summary = "2FA Durumum",
            description = "Kullanıcının Keycloak'ta kayıtlı OTP credential'ı var mı kontrol eder.")
    public ResponseEntity<Map<String, Boolean>> get2FAStatus() {
        UUID userId = securityUtils.getCurrentUserId();
        boolean enabled = keycloakAdminService.is2FAEnabled(userId.toString());
        return ResponseEntity.ok(Map.of("enabled", enabled));
    }

    @PutMapping("/me/2fa")
    @Operation(summary = "2FA Aç/Kapat",
            description = "Tercihler sayfasından çağrılır. enabled=true → bir sonraki login'de CONFIGURE_TOTP istenir; false → mevcut OTP credential'ları silinir.")
    public ResponseEntity<Map<String, Object>> toggle2FA(@RequestParam boolean enabled) {
        UUID userId = securityUtils.getCurrentUserId();
        if (enabled) {
            keycloakAdminService.enable2FA(userId.toString());
        } else {
            keycloakAdminService.disable2FA(userId.toString());
        }
        boolean nowEnabled = keycloakAdminService.is2FAEnabled(userId.toString());
        return ResponseEntity.ok(Map.of(
                "enabled", nowEnabled,
                "message", enabled
                        ? "2FA bir sonraki girişte kurulması istenecek."
                        : "2FA devre dışı bırakıldı."
        ));
    }
}