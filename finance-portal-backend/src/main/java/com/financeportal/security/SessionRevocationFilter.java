package com.financeportal.security;

import com.financeportal.model.entity.User;
import com.financeportal.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

/**
 * Admin "Tüm Oturumları Kapat" eyleminden sonra, kullanıcının mevcut access
 * token'larını Keycloak'ın 5dk expire'ını beklemeden ANINDA geçersiz kılar.
 *
 * Mantık:
 *   user.sessionInvalidatedAt set ise VE JWT'nin iat (issued-at) claim'i
 *   bundan ÖNCE ise → SecurityContext temizlenir → istek 401 alır.
 *
 * UserBanFilter ile aynı zincirdedir; BearerTokenAuthenticationFilter'dan
 * SONRA, UserSyncFilter'dan SONRA çalışır.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SessionRevocationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtToken) {
            Jwt jwt = jwtToken.getToken();
            String userIdStr = jwt.getClaimAsString("sub");

            if (userIdStr != null) {
                try {
                    UUID userId = UUID.fromString(userIdStr);
                    User user = userRepository.findById(userId).orElse(null);

                    if (user != null && user.getSessionInvalidatedAt() != null) {
                        Instant tokenIssuedAt = jwt.getIssuedAt();
                        if (tokenIssuedAt != null && tokenIssuedAt.isBefore(user.getSessionInvalidatedAt())) {
                            log.info("[SESSION-REVOKE] {} için token iptal edildi (iat={} < invalidatedAt={})",
                                    user.getUsername(), tokenIssuedAt, user.getSessionInvalidatedAt());
                            SecurityContextHolder.clearContext();
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write(
                                    "{\"status\":401,\"error\":\"session_revoked\"," +
                                    "\"message\":\"Oturumunuz yönetici tarafından sonlandırıldı. Lütfen tekrar giriş yapın.\"}"
                            );
                            return;
                        }
                    }
                } catch (IllegalArgumentException e) {
                    // sub UUID parse edilemedi — UserSyncFilter zaten oluşturmuş olur normalde
                    log.debug("[SESSION-REVOKE] sub UUID parse edilemedi: {}", userIdStr);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
