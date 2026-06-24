package com.financeportal.security;

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

    // JWT token yoksa (geliştirme/test ortamı) fallback olarak kullanılan sabit UUID.
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
        return MOCK_USER_ID;
    }
}