package com.financeportal.security;

import com.financeportal.model.entity.User;
import com.financeportal.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserBanFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtToken) {
            String userIdStr = jwtToken.getToken().getClaimAsString("sub");

            if (userIdStr != null) {
                userRepository.findById(UUID.fromString(userIdStr)).ifPresent(user -> {
                    if (isBanned(user)) {
                        try {
                            sendBanResponse(response, user);
                        } catch (IOException e) {
                            // ifPresent lambda'dan checked exception fırlatılamaz; hata zaten response'a yazılamadı, logluyoruz.
                            e.printStackTrace();
                        }
                    }
                });
            }

            // lambda içinden filter chain durdurulamadığı için 403 yazıldıysa burada erken çıkıyoruz.
            if (response.getStatus() == HttpServletResponse.SC_FORBIDDEN) return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isBanned(User user) {
        if (user.isBanPermanent()) return true;
        return user.getBannedUntil() != null && LocalDateTime.now().isBefore(user.getBannedUntil());
    }

    private void sendBanResponse(HttpServletResponse response, User user) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        String message;
        if (user.isBanPermanent()) {
            message = "{\"error\": \"Hesabınız kalıcı olarak askıya alınmıştır.\", \"banType\": \"PERMANENT\"}";
        } else {
            message = String.format(
                    "{\"error\": \"Hesabınız %s tarihine kadar askıya alınmıştır.\", \"banType\": \"TEMPORARY\", \"until\": \"%s\"}",
                    user.getBannedUntil(), user.getBannedUntil()
            );
        }
        response.getWriter().write(message);
    }
}
