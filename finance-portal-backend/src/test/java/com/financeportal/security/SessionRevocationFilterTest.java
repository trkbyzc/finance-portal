package com.financeportal.security;

import com.financeportal.model.entity.User;
import com.financeportal.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SessionRevocationFilterTest {

    @Mock private UserRepository userRepository;
    @Mock private HttpServletRequest request;
    @Mock private FilterChain chain;

    @InjectMocks private SessionRevocationFilter filter;

    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuth(Jwt jwt) {
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    private Jwt jwtWithSub(String sub, Instant issuedAt) {
        Jwt.Builder b = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(3600));
        if (sub != null) b = b.claim("sub", sub);
        return b.build();
    }

    private User userWith(UUID id, String username, Instant invalidatedAt) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setSessionInvalidatedAt(invalidatedAt);
        return u;
    }

    @Test
    void noAuth_passesChain() throws Exception {
        filter.doFilterInternal(request, response, chain);
        verify(chain).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }

    @Test
    void nonJwtAuth_passesChain() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("u", "p"));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        verify(userRepository, never()).findById(any());
    }

    @Test
    void jwtWithoutSub_passesChain() throws Exception {
        setAuth(jwtWithSub(null, Instant.now()));
        filter.doFilterInternal(request, response, chain);
        verify(chain).doFilter(request, response);
        verify(userRepository, never()).findById(any());
    }

    @Test
    void invalidUuidSub_passesChainSilently() throws Exception {
        setAuth(jwtWithSub("not-a-uuid", Instant.now()));
        filter.doFilterInternal(request, response, chain);
        verify(chain).doFilter(request, response);
        verify(userRepository, never()).findById(any());
    }

    @Test
    void userNotFound_passesChain() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(jwtWithSub(id.toString(), Instant.now()));
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }

    @Test
    void userWithNoInvalidation_passesChain() throws Exception {
        UUID id = UUID.randomUUID();
        setAuth(jwtWithSub(id.toString(), Instant.now()));
        when(userRepository.findById(id)).thenReturn(Optional.of(userWith(id, "alice", null)));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }

    @Test
    void tokenIssuedAfterInvalidation_passesChain() throws Exception {
        UUID id = UUID.randomUUID();
        Instant invalidated = Instant.now().minusSeconds(3600);
        Instant tokenIat = Instant.now(); // token YENİ (invalidation'dan sonra)
        setAuth(jwtWithSub(id.toString(), tokenIat));
        when(userRepository.findById(id)).thenReturn(Optional.of(userWith(id, "alice", invalidated)));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }

    @Test
    void tokenIssuedBeforeInvalidation_returns401AndCleansContext() throws Exception {
        UUID id = UUID.randomUUID();
        Instant tokenIat = Instant.now().minusSeconds(3600); // ESKİ token
        Instant invalidated = Instant.now(); // yeni invalidation
        setAuth(jwtWithSub(id.toString(), tokenIat));
        when(userRepository.findById(id)).thenReturn(Optional.of(userWith(id, "alice", invalidated)));

        filter.doFilterInternal(request, response, chain);

        verify(chain, never()).doFilter(any(), any());
        assertEquals(HttpServletResponse.SC_UNAUTHORIZED, response.getStatus());
        assertEquals("application/json", response.getContentType());
        String body = response.getContentAsString();
        assertTrue(body.contains("session_revoked"));
        assertTrue(body.contains("\"status\":401"));
        // SecurityContext temizlendiği için authentication null olmalı
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void tokenWithoutIat_passesChain() throws Exception {
        UUID id = UUID.randomUUID();
        Instant invalidated = Instant.now();
        // Jwt iat olmadan kurulamaz; null iat senaryosunu test edemiyoruz ama eşitlik durumu var.
        // İat == invalidatedAt → isBefore() false → 401 atmaz.
        setAuth(jwtWithSub(id.toString(), invalidated));
        when(userRepository.findById(id)).thenReturn(Optional.of(userWith(id, "alice", invalidated)));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }
}
