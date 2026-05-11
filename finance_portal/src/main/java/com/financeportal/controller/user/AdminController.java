package com.financeportal.controller;

import com.financeportal.service.user.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Tüm class admin korumasında
public class AdminController {

    private final AdminService adminService;

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