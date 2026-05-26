package com.financeportal.service.user;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.user.UserDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.Role;
import com.financeportal.repository.UserRepository;
import com.financeportal.service.auth.KeycloakAdminService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;

    // ---------- LISTING ----------

    @Transactional(readOnly = true)
    public Page<UserDto> searchUsers(String q, String roleFilter, Boolean bannedFilter, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.ASC, "username")
        );
        Specification<User> spec = buildSpec(q, roleFilter, bannedFilter);
        Page<User> users = userRepository.findAll(spec, pageable);

        // Her satır için Keycloak'tan realmRoles çek. 403/yetki yoksa boş döner;
        // KeycloakAdminService.getRealmRoles içeride zaten sessizce loglayıp empty döndürüyor.
        return users.map(user -> {
            List<String> realmRoles = keycloakAdminService.getRealmRoles(user.getId().toString());
            return toDto(user, realmRoles);
        });
    }

    private Specification<User> buildSpec(String q, String roleFilter, Boolean bannedFilter) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();

            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("username")), like),
                        cb.like(cb.lower(root.get("email")), like)
                ));
            }
            if (roleFilter != null && !roleFilter.isBlank()) {
                try {
                    Role role = Role.valueOf(roleFilter.toUpperCase());
                    preds.add(cb.equal(root.get("role"), role));
                } catch (IllegalArgumentException ignored) {
                    // bilinmeyen rol → görmezden gel
                }
            }
            if (bannedFilter != null) {
                Predicate banPermanent = cb.isTrue(root.get("banPermanent"));
                Predicate banUntil = cb.greaterThan(root.get("bannedUntil"), LocalDateTime.now());
                Predicate isBanned = cb.or(banPermanent, banUntil);
                preds.add(bannedFilter ? isBanned : cb.not(isBanned));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };
    }

    // ---------- BAN OPERATIONS ----------

    @Transactional
    public void banUser(UUID userId, int days) {
        User user = findOrThrow(userId);
        user.setBannedUntil(LocalDateTime.now().plusDays(days));
        user.setBanPermanent(false);
        userRepository.save(user);
        log.info("[ADMIN] {} kullanıcısı {} gün süreyle banlandı.", user.getUsername(), days);
    }

    @Transactional
    public void banPermanent(UUID userId) {
        User user = findOrThrow(userId);
        user.setBanPermanent(true);
        user.setBannedUntil(null);
        userRepository.save(user);
        // Kalıcı ban'a düşen kullanıcının tüm oturumlarını da kapat (en iyi efor).
        keycloakAdminService.logoutAllSessions(user.getId().toString());
        log.info("[ADMIN] {} kullanıcısı KALICI olarak banlandı.", user.getUsername());
    }

    @Transactional
    public void unbanUser(UUID userId) {
        User user = findOrThrow(userId);
        user.setBannedUntil(null);
        user.setBanPermanent(false);
        userRepository.save(user);
        log.info("[ADMIN] {} kullanıcısının banı kaldırıldı.", user.getUsername());
    }

    // ---------- SESSION ----------

    public boolean logoutAllSessions(UUID userId) {
        User user = findOrThrow(userId);
        boolean ok = keycloakAdminService.logoutAllSessions(user.getId().toString());
        log.info("[ADMIN] {} için force-logout sonucu: {}", user.getUsername(), ok ? "OK" : "BAŞARISIZ");
        return ok;
    }

    // ---------- HELPERS ----------

    private User findOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı: " + userId));
    }

    private UserDto toDto(User user, List<String> realmRoles) {
        boolean tempActive = user.getBannedUntil() != null
                && LocalDateTime.now().isBefore(user.getBannedUntil());
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .isBanned(tempActive || user.isBanPermanent())
                .banPermanent(user.isBanPermanent())
                .bannedUntil(user.getBannedUntil())
                .role(user.getRole())
                .realmRoles(realmRoles)
                .build();
    }
}
