package com.financeportal.security;

import com.financeportal.repository.UserRepository;
import com.financeportal.service.user.UserService; // 🚀 EKLENDİ
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import java.time.Duration;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserSyncFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final UserService userService; // 🚀 EKLENDİ

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtToken) {
            String subject = jwtToken.getToken().getClaimAsString("sub");

            if (subject != null) {
                String cacheKey = "user_sync:" + subject;

                // 🚀 REDIS KONTROLÜ: Eğer bu kullanıcıyı son 1 saatte senkronize ettiysek DB'yi yorma
                if (Boolean.FALSE.equals(redisTemplate.hasKey(cacheKey))) {
                    UUID userId = UUID.fromString(subject);

                    if (!userRepository.existsById(userId)) {
                        syncUser(jwtToken.getToken(), userId);
                    }

                    // Senkronize edildi veya zaten var; 1 saat boyunca bir daha sorma
                    redisTemplate.opsForValue().set(cacheKey, "synced", Duration.ofHours(1));
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private void syncUser(Jwt jwt, UUID userId) {
        // Token'dan email ve username'i default fallback'lerle güvenli okuma
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");

        if(username == null) username = "user_" + userId.toString().substring(0,8);
        if(email == null) email = username + "@financeportal.local";

        // EŞZAMANLI (CONCURRENT) İSTEKLERDE ÇAKIŞMAYI (DUPLICATE KEY) ÖNLEME
        try {
            userService.syncAndCreateUser(userId, username, email);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Paralel atılan ikinci istek buraya düşer. Endişe edecek bir şey yok,
            // birinci istek kaydı halletmiş demektir. Görmezden geliyoruz.
            System.out.println("⚠️ Kullanıcı eşzamanlı bir istek tarafından zaten kaydedildi: " + username);
        }
    }
}