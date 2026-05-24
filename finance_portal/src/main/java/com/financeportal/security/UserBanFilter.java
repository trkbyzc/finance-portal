package com.financeportal.security;

import com.financeportal.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;


import java.util.UUID;
import java.io.IOException;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class UserBanFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtToken) {
            // 🚀 KRİTİK: getName() yerine token'daki 'sub' (UUID) değerini kullanıyoruz
            String userIdStr = jwtToken.getToken().getClaimAsString("sub");

            if (userIdStr != null) {
                userRepository.findById(UUID.fromString(userIdStr)).ifPresent(user -> {
                    if (user.getBannedUntil() != null && LocalDateTime.now().isBefore(user.getBannedUntil())) {
                        try {
                            sendBanResponse(response, user.getBannedUntil());
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                });
            }

            if (response.getStatus() == HttpServletResponse.SC_FORBIDDEN) return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendBanResponse(HttpServletResponse response, LocalDateTime until) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        String message = String.format("{\"error\": \"Hesabınız %s tarihine kadar askıya alınmıştır.\"}", until);
        response.getWriter().write(message);
    }
}