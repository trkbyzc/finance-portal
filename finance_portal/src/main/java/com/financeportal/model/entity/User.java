package com.financeportal.model.entity;

import com.financeportal.model.enums.RiskProfile;
import com.financeportal.model.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private UUID id; // @GeneratedValue kaldırdık! ID'yi Keycloak verecek.

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private RiskProfile riskProfile;

    @Column(name = "banned_until")
    private LocalDateTime bannedUntil;

    /**
     * Süresiz ban bayrağı. true ise bannedUntil değerinden bağımsız olarak kullanıcı yasaklıdır.
     * false (default) ise sadece bannedUntil > now olduğu sürece yasaklıdır (geçici ban).
     */
    @Column(name = "ban_permanent", nullable = false)
    private boolean banPermanent;

    // 🚀 2FA ALANLARI TAMAMEN SİLİNDİ! (Artık Keycloak ilgileniyor)

    // 🚀 RICH DOMAIN MODEL: Kendi kendini başlatan "Zengin" metod
    public static User createNewUser(UUID id, String username, String email) {
        User user = new User();
        user.setId(id); // ID doğrudan Keycloak'tan gelecek
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("MANAGED_BY_KEYCLOAK"); // Şifreyi kendi DB'mizde tutmuyoruz
        user.setRole(Role.USER);
        user.setBannedUntil(null);
        user.setBanPermanent(false);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    // 🚀 RICH DOMAIN MODEL: İş mantığını barındıran metod
    public void applyKycProfile(RiskProfile profile) {
        this.riskProfile = profile;
    }
}