package com.financeportal.service.auth;

import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.apache.commons.codec.binary.Base32;


import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.ws.rs.core.Response;
import java.util.*;

@Service
@Slf4j
public class KeycloakAdminService {

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

    private Keycloak keycloak;

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

    public Map<String, String> generateOTPCredential(String userId, String username) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

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
        new java.security.SecureRandom().nextBytes(buffer);

        // Base32 encoder oluştur
        Base32 base32 = new Base32();

        // Encode et ve padding karakterlerini kaldır
        String encoded = base32.encodeAsString(buffer);
        return encoded.replaceAll("=", "");
    }

}
