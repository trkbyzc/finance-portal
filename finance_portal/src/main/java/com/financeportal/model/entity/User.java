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
@Data // Bu notasyon sayesinde Getter, Setter, toString vb. otomatik oluşur.
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false) // Şifre alanını buraya ekledik
    private String password;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;


    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private RiskProfile riskProfile;

    @Column(name = "banned_until")
    private LocalDateTime bannedUntil;

}