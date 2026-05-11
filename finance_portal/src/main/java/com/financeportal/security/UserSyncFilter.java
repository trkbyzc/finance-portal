package com.financeportal.config;

import com.financeportal.model.entity.User;
import com.financeportal.repository.UserRepository;
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

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class UserSyncFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    public UserSyncFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtToken) {
            Jwt jwt = jwtToken.getToken();

            // Token içerisinden gerekli Keycloak kullanıcı bilgilerini çekiyoruz
            String subject = jwt.getClaimAsString("sub"); // Keycloak User ID
            String username = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");

            if (subject != null) {
                UUID userId = UUID.fromString(subject);

                // Eğer kullanıcı veritabanımızda yoksa veya güncellenmesi gerekiyorsa
                if (!userRepository.existsById(userId)) {
                    User user = new User();
                    user.setId(userId);
                    user.setUsername(username != null ? username : "unknown");
                    user.setEmail(email != null ? email : subject + "@unknown.com");

                    // YENİ EKLENEN SATIR: Veritabanındaki "password null olamaz" kuralını atlatmak için kukla şifre
                    user.setPassword("MANAGED_BY_KEYCLOAK");

                    user.setCreatedAt(LocalDateTime.now());
                    userRepository.save(user);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}