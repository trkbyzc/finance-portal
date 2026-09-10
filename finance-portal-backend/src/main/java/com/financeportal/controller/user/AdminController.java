package com.financeportal.controller.user;

import com.financeportal.model.dto.common.MessageResponseDto;
import com.financeportal.model.dto.user.AdminActionResponseDto;
import com.financeportal.model.dto.user.DeleteUserResponseDto;
import com.financeportal.model.dto.user.UserDto;
import com.financeportal.service.user.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    /**
     * Filtreli + sayfalı kullanıcı listesi.
     * @param q          username veya email substring (case-insensitive)
     * @param role       USER / ADMIN (opsiyonel)
     * @param banned     true → şu an banlı (kalıcı veya aktif geçici), false → banlı değil, null → hepsi
     * @param page       0-indexed sayfa numarası
     * @param size       sayfa boyutu (1-100)
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean banned,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminService.searchUsers(q, role, banned, page, size));
    }

    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<MessageResponseDto> banUser(@PathVariable UUID userId, @RequestParam int days) {
        adminService.banUser(userId, days);
        return ResponseEntity.ok(MessageResponseDto.of(days + " günlük geçici ban uygulandı."));
    }

    @PostMapping("/users/{userId}/ban-permanent")
    public ResponseEntity<MessageResponseDto> banPermanent(@PathVariable UUID userId) {
        adminService.banPermanent(userId);
        return ResponseEntity.ok(MessageResponseDto.of("Kullanıcı kalıcı olarak banlandı."));
    }

    @PostMapping("/users/{userId}/unban")
    public ResponseEntity<MessageResponseDto> unbanUser(@PathVariable UUID userId) {
        adminService.unbanUser(userId);
        return ResponseEntity.ok(MessageResponseDto.of("Kullanıcının banı kaldırıldı."));
    }

    @PostMapping("/users/{userId}/logout-all")
    public ResponseEntity<AdminActionResponseDto> logoutAll(@PathVariable UUID userId) {
        boolean ok = adminService.logoutAllSessions(userId);
        return ResponseEntity.ok(AdminActionResponseDto.builder()
                .success(ok)
                .message(ok
                        ? "Tüm oturumlar kapatıldı. Mevcut access token ~5dk içinde süresi dolacak."
                        : "Keycloak oturumları kapatılamadı (servis hesabı yetkisi yok veya bağlantı hatası).")
                .build());
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<DeleteUserResponseDto> deleteUser(@PathVariable UUID userId) {
        AdminService.DeleteResult result = adminService.deleteUser(userId);
        String message = result.keycloakDeleted()
                ? result.username() + " hem Keycloak'tan hem DB'den silindi."
                : result.username() + " sadece DB'den silindi (Keycloak'ta zaten yoktu).";
        return ResponseEntity.ok(DeleteUserResponseDto.builder()
                .success(true)
                .keycloakDeleted(result.keycloakDeleted())
                .message(message)
                .build());
    }
}
