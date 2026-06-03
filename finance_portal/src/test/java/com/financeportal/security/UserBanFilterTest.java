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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserBanFilterTest {

    @Mock private UserRepository userRepository;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain chain;

    @InjectMocks private UserBanFilter filter;

    private StringWriter writer;

    @BeforeEach
    void setUp() throws Exception {
        writer = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(writer));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setupJwt(String sub) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", sub)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    @Test
    void noAuth_passesChain() throws Exception {
        filter.doFilterInternal(request, response, chain);
        verify(chain).doFilter(request, response);
    }

    @Test
    void jwtWithoutSub_passesChain() throws Exception {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "RS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .claims(c -> c.put("foo", "bar"))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void userNotFound_passesChain() throws Exception {
        UUID id = UUID.randomUUID();
        setupJwt(id.toString());
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void userNotBanned_passesChain() throws Exception {
        UUID id = UUID.randomUUID();
        setupJwt(id.toString());
        User user = new User();
        user.setId(id);
        user.setBanPermanent(false);
        user.setBannedUntil(null);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void userBannedPermanent_sendsForbiddenAndBlocks() throws Exception {
        UUID id = UUID.randomUUID();
        setupJwt(id.toString());
        User user = new User();
        user.setId(id);
        user.setBanPermanent(true);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(response.getStatus()).thenReturn(HttpServletResponse.SC_FORBIDDEN);

        filter.doFilterInternal(request, response, chain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(chain, never()).doFilter(any(), any());
        // response body has banType=PERMANENT
        org.junit.jupiter.api.Assertions.assertTrue(writer.toString().contains("PERMANENT"));
    }

    @Test
    void userBannedTemporary_sendsForbiddenAndBlocks() throws Exception {
        UUID id = UUID.randomUUID();
        setupJwt(id.toString());
        User user = new User();
        user.setId(id);
        user.setBanPermanent(false);
        user.setBannedUntil(LocalDateTime.now().plusDays(3));
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(response.getStatus()).thenReturn(HttpServletResponse.SC_FORBIDDEN);

        filter.doFilterInternal(request, response, chain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(chain, never()).doFilter(any(), any());
        org.junit.jupiter.api.Assertions.assertTrue(writer.toString().contains("TEMPORARY"));
    }

    @Test
    void userBannedUntilInPast_notBanned() throws Exception {
        UUID id = UUID.randomUUID();
        setupJwt(id.toString());
        User user = new User();
        user.setId(id);
        user.setBanPermanent(false);
        user.setBannedUntil(LocalDateTime.now().minusDays(1));
        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
