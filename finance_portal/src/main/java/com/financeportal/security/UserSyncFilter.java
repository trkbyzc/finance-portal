package com.financeportal.security;

import com.financeportal.repository.UserRepository;
import com.financeportal.service.user.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserSyncFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final UserService userService;

    @Value("${app.user-sync.cache-ttl-hours:1}")
    private long userSyncCacheTtlHours = 1;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtToken) {
            String subject = jwtToken.getToken().getClaimAsString("sub");

            if (subject != null) {
                String cacheKey = "user_sync:" + subject;

                // Redis SETNX ile distributed lock: aynı kullanıcı için paralel istekler
                // (örn. login sonrası /users/me + /portfolio/me + /watchlist/me eş zamanlı)
                // ilk gelen "synced" işaretler, diğerleri burada erken çıkar. setIfAbsent
                // atomic — race'siz tek log garantisi. 1 saatlik TTL ile rol sync de
                // periyodik (yeni rol Keycloak'tan geldiğinde max 1 saat gecikme).
                Boolean acquired = redisTemplate.opsForValue()
                        .setIfAbsent(cacheKey, "synced", Duration.ofHours(userSyncCacheTtlHours));
                if (Boolean.TRUE.equals(acquired)) {
                    UUID userId = UUID.fromString(subject);
                    Jwt jwt = jwtToken.getToken();
                    try {
                        if (!userRepository.existsById(userId)) {
                            syncNewUser(jwt, userId);
                        }
                        // Var olan kullanıcılar için bile rolü Keycloak'a göre eşitle —
                        // superadmin gibi rolü sonradan ADMIN olan kullanıcılar DB'de
                        // takılı kalmasın.
                        userService.syncRoleFromKeycloak(userId, isKeycloakAdmin(jwt));
                    } catch (RuntimeException ex) {
                        // İş başarısız → lock'u serbest bırak ki bir sonraki istek tekrar
                        // denesin (1 saat retry beklemesin).
                        redisTemplate.delete(cacheKey);
                        throw ex;
                    }
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private void syncNewUser(Jwt jwt, UUID userId) {
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");

        if (username == null) username = "user_" + userId.toString().substring(0, 8);
        if (email == null) email = username + "@financeportal.local";

        try {
            userService.syncAndCreateUser(userId, username, email);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Paralel istekte ikinci kayıt için race — birinci hallediyor, sessizce geç.
            log.debug("[USER-SYNC] {} zaten paralel istekle kaydedilmiş, atlandı.", username);
        }
    }

    private boolean isKeycloakAdmin(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return false;
        Object rolesObj = realmAccess.get("roles");
        if (!(rolesObj instanceof List<?> roles)) return false;
        for (Object role : roles) {
            if (role != null && "ADMIN".equalsIgnoreCase(role.toString())) return true;
        }
        return false;
    }
}
