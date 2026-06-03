package com.financeportal.security;

import com.financeportal.repository.UserRepository;
import com.financeportal.service.user.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserSyncFilterTest {

    @Mock private UserRepository userRepository;
    @Mock private RedisTemplate<String, String> redisTemplate;
    @Mock private UserService userService;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain chain;

    @InjectMocks private UserSyncFilter filter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuth(Jwt jwt) {
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    private Jwt buildJwt(String sub, String username, String email, Object realmAccess) {
        Jwt.Builder b = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600));
        if (sub != null) b = b.claim("sub", sub);
        if (username != null) b = b.claim("preferred_username", username);
        if (email != null) b = b.claim("email", email);
        if (realmAccess != null) b = b.claim("realm_access", realmAccess);
        return b.build();
    }

    @Test
    void noAuth_passesChain() throws Exception {
        filter.doFilterInternal(request, response, chain);
        verify(chain).doFilter(request, response);
        verify(userService, never()).syncAndCreateUser(any(), anyString(), anyString());
    }

    @Test
    void jwtWithoutSub_passesChain() throws Exception {
        setAuth(buildJwt(null, "u", "e@x", null));
        filter.doFilterInternal(request, response, chain);
        verify(chain).doFilter(request, response);
    }

    @Test
    void cacheHit_skipsSync() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(buildJwt(id.toString(), "alice", "a@x", null));
        when(redisTemplate.hasKey("user_sync:" + id)).thenReturn(true);

        filter.doFilterInternal(request, response, chain);

        verify(userService, never()).syncAndCreateUser(any(), anyString(), anyString());
        verify(userService, never()).syncRoleFromKeycloak(any(), org.mockito.ArgumentMatchers.anyBoolean());
        verify(chain).doFilter(request, response);
    }

    @Test
    void cacheMissUserExists_syncsRoleOnly() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(buildJwt(id.toString(), "alice", "a@x", Map.of("roles", List.of("USER"))));
        when(redisTemplate.hasKey("user_sync:" + id)).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(userRepository.existsById(id)).thenReturn(true);

        filter.doFilterInternal(request, response, chain);

        verify(userService, never()).syncAndCreateUser(any(), anyString(), anyString());
        verify(userService).syncRoleFromKeycloak(id, false);
        verify(valueOps).set("user_sync:" + id, "synced", Duration.ofHours(1));
    }

    @Test
    void cacheMissNewUser_createsAndSyncsRole() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(buildJwt(id.toString(), "bob", "bob@x", Map.of("roles", List.of("ADMIN"))));
        when(redisTemplate.hasKey("user_sync:" + id)).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(userRepository.existsById(id)).thenReturn(false);

        filter.doFilterInternal(request, response, chain);

        verify(userService).syncAndCreateUser(id, "bob", "bob@x");
        verify(userService).syncRoleFromKeycloak(id, true);
    }

    @Test
    void newUserWithNullUsername_generatesFallback() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(buildJwt(id.toString(), null, null, null));
        when(redisTemplate.hasKey("user_sync:" + id)).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(userRepository.existsById(id)).thenReturn(false);

        filter.doFilterInternal(request, response, chain);

        org.mockito.ArgumentCaptor<String> userCap = org.mockito.ArgumentCaptor.forClass(String.class);
        org.mockito.ArgumentCaptor<String> emailCap = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(userService).syncAndCreateUser(eq(id), userCap.capture(), emailCap.capture());

        org.junit.jupiter.api.Assertions.assertTrue(userCap.getValue().startsWith("user_"));
        org.junit.jupiter.api.Assertions.assertTrue(emailCap.getValue().endsWith("@financeportal.local"));
    }

    @Test
    void newUserDataIntegrityViolation_swallowed() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(buildJwt(id.toString(), "race", "r@x", null));
        when(redisTemplate.hasKey("user_sync:" + id)).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(userRepository.existsById(id)).thenReturn(false);
        org.mockito.Mockito.doThrow(new DataIntegrityViolationException("dup"))
                .when(userService).syncAndCreateUser(any(), anyString(), anyString());

        filter.doFilterInternal(request, response, chain);

        verify(userService).syncRoleFromKeycloak(id, false);
        verify(chain).doFilter(request, response);
    }

    @Test
    void realmAccessRolesAsStringObject_lookupAdminTrue() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(buildJwt(id.toString(), "x", "x@x", Map.of("roles", List.of("admin", "USER"))));
        when(redisTemplate.hasKey("user_sync:" + id)).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(userRepository.existsById(id)).thenReturn(true);

        filter.doFilterInternal(request, response, chain);

        verify(userService).syncRoleFromKeycloak(id, true);
    }

    @Test
    void realmAccessRolesNotList_returnsFalse() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(buildJwt(id.toString(), "x", "x@x", Map.of("roles", "ADMIN_string_not_list")));
        when(redisTemplate.hasKey("user_sync:" + id)).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(userRepository.existsById(id)).thenReturn(true);

        filter.doFilterInternal(request, response, chain);

        verify(userService).syncRoleFromKeycloak(id, false);
    }
}
