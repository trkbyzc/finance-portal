package com.financeportal.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.context.annotation.Profile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Profile("dev")
public class AuthController {

    // Kendi Keycloak URL'in (Port 8080 ise böyle kalsın, realm adın finance-realm ise dokunma)
    private final String keycloakTokenUrl = "http://localhost:8080/realms/finance-realm/protocol/openid-connect/token";

    // Keycloak'taki Clients sekmesindeki client id'n (örn: finance-client)
    private final String clientId = "finance-client";

    @GetMapping("/token/testuser")
    public ResponseEntity<?> getTestUserToken() {
        // testuser şifreni buraya yaz
        return fetchTokenFromKeycloak("testuser", "testuser");
    }

    @GetMapping("/token/superadmin")
    public ResponseEntity<?> getAdminToken() {
        // superadmin şifreni buraya yaz
        return fetchTokenFromKeycloak("superadmin", "superadmin");
    }

    private ResponseEntity<?> fetchTokenFromKeycloak(String username, String password) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("grant_type", "password");
        body.add("username", username);
        body.add("password", password);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(keycloakTokenUrl, request, String.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Keycloak'tan token alınamadı. ClientId veya Şifre yanlış olabilir: " + e.getMessage());
        }
    }
}