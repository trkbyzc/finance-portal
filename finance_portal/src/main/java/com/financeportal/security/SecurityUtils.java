package com.financeportal.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class SecurityUtils {

    // TEST İÇİN SABİT KULLANICI ID'si (Veritabanındaki mevcut bir user'ın ID'sini buraya koyabilirsin)
    // Eğer DB'de user yoksa, UserService üzerinden bir user oluşturup onun ID'sini kullan.
    private static final UUID MOCK_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    public UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            String sub = jwt.getClaimAsString("sub");
            if (sub != null) {
                return UUID.fromString(sub);
            }
        }

        log.warn("DIKKAT: Güvenlik token'ı bulunamadı! Geliştirme modu aktif, Mock User ID dönülüyor.");
        return MOCK_USER_ID; // Patlamasın diye test ID'si dönüyoruz
    }
}