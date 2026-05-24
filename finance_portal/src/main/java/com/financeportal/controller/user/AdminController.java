package com.financeportal.controller.user;

import com.financeportal.model.dto.user.UserDto;
import com.financeportal.service.user.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Tüm class admin korumasında
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsersForAdmin());
    }

    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<String> banUser(@PathVariable UUID userId, @RequestParam int days) {
        adminService.banUser(userId, days);
        return ResponseEntity.ok("Kullanıcı " + days + " günlüğüne banlandı.");
    }

    @PostMapping("/users/{userId}/unban")
    public ResponseEntity<String> unbanUser(@PathVariable UUID userId) {
        adminService.unbanUser(userId);
        return ResponseEntity.ok("Kullanıcının banı kaldırıldı.");
    }
}