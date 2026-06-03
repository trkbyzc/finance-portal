package com.financeportal.service.auth;

import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.apache.commons.codec.binary.Base32;


import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.ws.rs.core.Response;
import java.util.*;

@Service
@Slf4j
public class KeycloakAdminService {

    // OTP secret üretimi için tek SecureRandom instance — her çağrıda new yaratmak
    // pahalı (entropy init) ve Sonar S2245 uyarısı veriyor.
    private static final java.security.SecureRandom SECURE_RANDOM = new java.security.SecureRandom();

    @Value("${keycloak.server-url:http://localhost:8080}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm:finance-realm}")
    private String realm;

    @Value("${keycloak.admin-username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin-password:admin}")
    private String adminPassword;

    @Value("${keycloak.admin-client-id:admin-cli}")
    private String adminClientId;

    /**
     * Şifre doğrulaması için kullanılacak public client. finance-client için Keycloak'ta
     * "Direct Access Grants" (Resource Owner Password Credentials) açık olmalı.
     */
    @Value("${keycloak.user-client-id:finance-client}")
    private String userClientId;

    private Keycloak keycloak;

    /** Token endpoint REST çağrıları için (verifyPassword). */
    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void init() {
        try {
            this.keycloak = KeycloakBuilder.builder()
                    .serverUrl(keycloakServerUrl)
                    .realm("master")
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();

            log.info("✅ Keycloak Admin Client başarıyla başlatıldı");
        } catch (Exception e) {
            log.error("❌ Keycloak Admin Client başlatılamadı: {}", e.getMessage(), e);
        }
    }

    @PreDestroy
    public void cleanup() {
        if (keycloak != null) {
            keycloak.close();
            log.info("🔒 Keycloak Admin Client kapatıldı");
        }
    }

    public String createUser(String username, String email, String password, String firstName, String lastName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            List<UserRepresentation> existingUsers = usersResource.search(username, true);
            if (!existingUsers.isEmpty()) {
                log.warn("⚠️ Kullanıcı zaten Keycloak'ta mevcut: {}", username);
                return existingUsers.get(0).getId();
            }

            UserRepresentation user = new UserRepresentation();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(true);
            user.setEmailVerified(true);

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);
            user.setCredentials(Collections.singletonList(credential));

            Response response = usersResource.create(user);

            if (response.getStatus() == 201) {
                String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
                log.info("✅ Keycloak'ta kullanıcı oluşturuldu: {} (ID: {})", username, userId);

                enable2FA(userId);

                response.close();
                return userId;
            } else {
                String errorMessage = response.readEntity(String.class);
                response.close();
                throw new RuntimeException("Keycloak kullanıcı oluşturma hatası: " + errorMessage);
            }

        } catch (Exception e) {
            log.error("❌ Keycloak kullanıcı oluşturma hatası: {}", e.getMessage(), e);
            throw new RuntimeException("Keycloak kullanıcı oluşturulamadı: " + e.getMessage(), e);
        }
    }

    public void enable2FA(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);
            UserRepresentation user = userResource.toRepresentation();

            user.setRequiredActions(Collections.singletonList("CONFIGURE_TOTP"));
            userResource.update(user);

            log.info("✅ 2FA aktif edildi (Required Action eklendi): {}", userId);
        } catch (Exception e) {
            log.error("❌ 2FA aktif etme hatası: {}", e.getMessage(), e);
            throw new RuntimeException("2FA aktif edilemedi: " + e.getMessage(), e);
        }
    }

    /**
     * Kullanıcının 2FA'sını kapatır:
     * 1. Tüm OTP credential'ları (otp tipinde) siler — varsa kayıtlı authenticator kalmasın
     * 2. CONFIGURE_TOTP required action'ı kaldırır — bir sonraki login'de istemez
     * Sonuçta kullanıcı sadece şifreyle girer.
     */
    public void disable2FA(String userId) {
        try {
            UserResource userResource = keycloak.realm(realm).users().get(userId);

            // 1) Tüm OTP credential'larını sil
            var creds = userResource.credentials();
            if (creds != null) {
                creds.stream()
                        .filter(c -> "otp".equalsIgnoreCase(c.getType()))
                        .forEach(c -> {
                            try {
                                userResource.removeCredential(c.getId());
                            } catch (Exception e) {
                                log.warn("[KC-2FA] OTP credential silinemedi (id={}): {}", c.getId(), e.getMessage());
                            }
                        });
            }

            // 2) CONFIGURE_TOTP required action'ı listeden çıkar
            UserRepresentation user = userResource.toRepresentation();
            List<String> actions = user.getRequiredActions();
            if (actions != null && actions.contains("CONFIGURE_TOTP")) {
                List<String> filtered = new ArrayList<>(actions);
                filtered.remove("CONFIGURE_TOTP");
                user.setRequiredActions(filtered);
                userResource.update(user);
            }
            log.info("✅ 2FA devre dışı bırakıldı: {}", userId);
        } catch (Exception e) {
            log.error("❌ 2FA devre dışı bırakma hatası: {}", e.getMessage(), e);
            throw new RuntimeException("2FA devre dışı bırakılamadı: " + e.getMessage(), e);
        }
    }

    /**
     * Kullanıcı için 2FA "aktif" mi? Aktif = en az 1 OTP credential kayıtlı.
     * CONFIGURE_TOTP required action sadece "kullanıcıdan kurmasını iste" demektir; gerçek
     * aktivasyon credential kaydedilince olur.
     */
    public boolean is2FAEnabled(String userId) {
        if (keycloak == null || userId == null) return false;
        try {
            var creds = keycloak.realm(realm).users().get(userId).credentials();
            return creds != null && creds.stream().anyMatch(c -> "otp".equalsIgnoreCase(c.getType()));
        } catch (Exception e) {
            log.warn("[KC-2FA] {} için 2FA status kontrolü başarısız: {}", userId, e.getMessage());
            return false;
        }
    }

    public void deleteUser(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            realmResource.users().delete(userId);
            log.info("✅ Keycloak'tan kullanıcı silindi: {}", userId);
        } catch (Exception e) {
            log.error("❌ Keycloak kullanıcı silme hatası: {}", e.getMessage(), e);
            throw new RuntimeException("Keycloak kullanıcı silinemedi: " + e.getMessage(), e);
        }
    }

    public String getUserIdByUsername(String username) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            List<UserRepresentation> users = realmResource.users().search(username, true);

            if (users.isEmpty()) {
                return null;
            }

            return users.get(0).getId();
        } catch (Exception e) {
            log.error("❌ Keycloak kullanıcı ID bulma hatası: {}", e.getMessage(), e);
            return null;
        }
    }

    // ⬇️ YENİ METHODLAR ⬇️

    public String getRealm() {
        return realm;
    }

    public Keycloak getKeycloak() {
        return keycloak;
    }

    public Map<String, String> generateOTPCredential(String username) {
        try {
            String secret = generateBase32Secret();

            String qrCodeUrl = String.format(
                    "otpauth://totp/FinancePortal:%s?secret=%s&issuer=FinancePortal&algorithm=SHA1&digits=6&period=30",
                    username,
                    secret
            );

            log.info("✅ OTP credential oluşturuldu: {} (Secret: {}...)", username, secret.substring(0, 4));

            Map<String, String> result = new HashMap<>();
            result.put("secret", secret);
            result.put("qrCodeUrl", qrCodeUrl);
            return result;

        } catch (Exception e) {
            log.error("❌ OTP credential oluşturma hatası: {}", e.getMessage(), e);
            throw new RuntimeException("OTP credential oluşturulamadı: " + e.getMessage(), e);
        }
    }

    private String generateBase32Secret() {
        byte[] buffer = new byte[20];
        SECURE_RANDOM.nextBytes(buffer);

        // Base32 encoder oluştur
        Base32 base32 = new Base32();

        // Encode et ve padding karakterlerini kaldır
        String encoded = base32.encodeAsString(buffer);
        return encoded.replaceAll("=", "");
    }

    // ============================================================
    // ADMIN PANEL UPGRADES (Phase 2)
    // ============================================================

    /**
     * Kullanıcının tüm Keycloak oturumlarını sonlandırır. Refresh token'lar invalide olur;
     * mevcut access token'lar süresi dolana kadar (~5dk) geçerli kalmaya devam eder.
     * Hata olursa false döner — caller log'lar ve devam eder.
     */
    public boolean logoutAllSessions(String keycloakUserId) {
        if (keycloak == null || keycloakUserId == null) return false;
        try {
            keycloak.realm(realm).users().get(keycloakUserId).logout();
            log.info("[KC-ADMIN] {} için tüm oturumlar kapatıldı.", keycloakUserId);
            return true;
        } catch (Exception e) {
            log.warn("[KC-ADMIN] {} için logout-all başarısız: {}", keycloakUserId, e.getMessage());
            return false;
        }
    }

    /**
     * Kullanıcının realm-level effective rollerini döner. Servis hesabında 'view-users' yetkisi
     * yoksa (403) veya başka bir hata olursa boş liste döner — caller bunu "Roles unavailable"
     * olarak gösterebilir.
     */
    public List<String> getRealmRoles(String keycloakUserId) {
        if (keycloak == null || keycloakUserId == null) return Collections.emptyList();
        try {
            List<RoleRepresentation> roles = keycloak.realm(realm).users().get(keycloakUserId)
                    .roles().realmLevel().listEffective();
            List<String> names = new ArrayList<>(roles.size());
            for (RoleRepresentation r : roles) names.add(r.getName());
            return names;
        } catch (Exception e) {
            log.warn("[KC-ADMIN] {} için realm roller çekilemedi (yetki/403 olabilir): {}",
                    keycloakUserId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ============================================================
    // ŞİFRE DEĞİŞİMİ
    // ============================================================

    /**
     * Kullanıcının mevcut şifresini Keycloak token endpoint'inde doğrular.
     * Direct Access Grants (Resource Owner Password) gerektirir — finance-client'ta açık olmalı.
     *
     * @return true: şifre doğru; false: yanlış / client config sorunu / network hatası
     */
    public boolean verifyPassword(String username, String password) {
        if (keycloak == null || username == null || password == null) return false;
        String url = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", userClientId);
        form.add("username", username);
        form.add("password", password);

        try {
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    url, new HttpEntity<>(form, headers), String.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException e) {
            // 401 = şifre yanlış (invalid_grant). 400 = client config / grant disabled.
            if (e.getStatusCode().value() != 401) {
                log.warn("[KC-PWD] verifyPassword {} → HTTP {}: {}",
                        username, e.getStatusCode().value(), e.getResponseBodyAsString());
            }
            return false;
        } catch (Exception e) {
            log.warn("[KC-PWD] verifyPassword {} network hatası: {}", username, e.getMessage());
            return false;
        }
    }

    /**
     * Kullanıcının şifresini Admin API ile günceller. Eski şifre kontrolü YAPMAZ —
     * caller önce verifyPassword ile doğrulamalı.
     */
    public void setPassword(String keycloakUserId, String newPassword) {
        if (keycloak == null) throw new IllegalStateException("Keycloak Admin Client başlatılmamış");
        try {
            CredentialRepresentation cred = new CredentialRepresentation();
            cred.setType(CredentialRepresentation.PASSWORD);
            cred.setValue(newPassword);
            cred.setTemporary(false);
            keycloak.realm(realm).users().get(keycloakUserId).resetPassword(cred);
            log.info("[KC-PWD] {} için şifre güncellendi.", keycloakUserId);
        } catch (Exception e) {
            log.error("[KC-PWD] setPassword başarısız ({}): {}", keycloakUserId, e.getMessage(), e);
            throw new RuntimeException("Şifre güncellenemedi: " + e.getMessage(), e);
        }
    }

}
