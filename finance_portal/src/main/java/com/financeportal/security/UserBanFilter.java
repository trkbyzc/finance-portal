package com.financeportal.config;

import com.financeportal.model.entity.User;
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

        // Eğer kullanıcı giriş yapmışsa (Misafir değilse)
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {

            // Keycloak'tan gelen ID veya Email (auth.getName() ne dönüyorsa ona göre arama yapmalısın)
            String emailOrId = auth.getName();

            // Kullanıcıyı DB'den bul (Burada findByEmail veya findById metodunu kendi repouna göre ayarla)
            userRepository.findByEmail(emailOrId).ifPresent(user -> {

                // Ban tarihi doluysa VE şu anki tarih ban tarihinden GERİDEYSE (Yani hala banlıysa)
                if (user.getBannedUntil() != null && LocalDateTime.now().isBefore(user.getBannedUntil())) {
                    try {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\": \"Hesabınız " + user.getBannedUntil() + " tarihine kadar askıya alınmıştır.\"}");
                        response.getWriter().flush();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            });

            // Eğer yukarıda banlı olduğu için cevap döndüysek, filtre zincirini kır ve devam etme
            if (response.getStatus() == HttpServletResponse.SC_FORBIDDEN) {
                return;
            }
        }

        // Temizse veya misafirse devam etmesine izin ver
        filterChain.doFilter(request, response);
    }
}