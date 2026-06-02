package com.financeportal.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class SecurityUtilsTest {

    @Mock
    private Authentication authentication;

    private final SecurityUtils utils = new SecurityUtils();

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void jwtWithSub_returnsParsedUuid() {
        UUID expectedId = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        Jwt jwt = Jwt.withTokenValue("dummy-token")
                .header("alg", "RS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .claim("sub", expectedId.toString())
                .build();
        JwtAuthenticationToken jwtAuth = new JwtAuthenticationToken(jwt);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(jwtAuth);
        SecurityContextHolder.setContext(context);

        UUID result = utils.getCurrentUserId();
        assertEquals(expectedId, result);
    }

    @Test
    void noAuthentication_returnsMockUserId() {
        // SecurityContext'te authentication yok → MOCK_USER_ID döner
        SecurityContextHolder.clearContext();
        UUID result = utils.getCurrentUserId();
        assertEquals(UUID.fromString("11111111-1111-1111-1111-111111111111"), result);
    }

    @Test
    void nonJwtAuthentication_returnsMockUserId() {
        // Authentication var ama JwtAuthenticationToken değil → MOCK_USER_ID döner
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        UUID result = utils.getCurrentUserId();
        assertEquals(UUID.fromString("11111111-1111-1111-1111-111111111111"), result);
    }

    @Test
    void jwtWithoutSubClaim_returnsMockUserId() {
        Jwt jwt = Jwt.withTokenValue("dummy")
                .header("alg", "RS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .claims(c -> c.put("other-claim", "value"))
                .build();
        JwtAuthenticationToken jwtAuth = new JwtAuthenticationToken(jwt);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(jwtAuth);
        SecurityContextHolder.setContext(context);

        UUID result = utils.getCurrentUserId();
        assertNotNull(result);
        assertEquals(UUID.fromString("11111111-1111-1111-1111-111111111111"), result);
    }
}
