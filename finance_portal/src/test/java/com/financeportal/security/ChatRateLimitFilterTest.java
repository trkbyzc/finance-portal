package com.financeportal.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChatRateLimitFilterTest {

    @Mock private StringRedisTemplate redis;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private FilterChain chain;

    private ChatRateLimitFilter filter;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        filter = new ChatRateLimitFilter(redis);
        ReflectionTestUtils.setField(filter, "perMinute", 3);
        ReflectionTestUtils.setField(filter, "perDay", 10);
        when(redis.opsForValue()).thenReturn(valueOps);
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest chatPost() {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/chat/messages");
        req.setRequestURI("/api/v1/chat/messages");
        return req;
    }

    private void authenticateAs(String sub) {
        Jwt jwt = Jwt.withTokenValue("t")
                .header("alg", "none")
                .claim("sub", sub)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new JwtAuthenticationToken(jwt, List.of()));
    }

    @Test
    void limitAltindaIstekGecer() throws Exception {
        authenticateAs("user-1");
        when(valueOps.increment(anyString())).thenReturn(1L);

        filter.doFilterInternal(chatPost(), response, chain);

        verify(chain).doFilter(any(), any());
        assertEquals(200, response.getStatus());
    }

    @Test
    void dakikaLimitiAsilinca429DonerVeIstekGecmez() throws Exception {
        authenticateAs("user-1");
        when(valueOps.increment(anyString())).thenReturn(4L); // perMinute = 3

        filter.doFilterInternal(chatPost(), response, chain);

        verify(chain, never()).doFilter(any(), any());
        assertEquals(429, response.getStatus());
        assertEquals("60", response.getHeader("Retry-After"));
        assertTrue(response.getContentAsString().contains("RATE_LIMITED"));
        // ChatWidget ayrıntı satırını data.message üzerinden okuyor.
        assertTrue(response.getContentAsString().contains("\"message\""));
    }

    /** TTL yalnızca sayaç ilk kez oluşturulduğunda yazılmalı; her istekte yazmak pencereyi kaydırırdı. */
    @Test
    void ttlSadeceIlkIstekteYazilir() throws Exception {
        authenticateAs("user-1");
        when(valueOps.increment(anyString())).thenReturn(1L, 2L);

        filter.doFilterInternal(chatPost(), response, chain);

        verify(redis).expire(anyString(), any(Duration.class)); // dakika sayacı için bir kez
    }

    /** Redis çökerse asistan tamamen susmamalı — arıza duruşu AÇIK. */
    @Test
    void redisPatlarsaIstekGecer() throws Exception {
        authenticateAs("user-1");
        when(valueOps.increment(anyString())).thenThrow(new RuntimeException("bağlantı yok"));

        filter.doFilterInternal(chatPost(), response, chain);

        verify(chain).doFilter(any(), any());
        assertEquals(200, response.getStatus());
    }

    /** Kimliksiz istek sayaca yazılmamalı; hepsi aynı kovaya düşüp birbirini engellerdi. */
    @Test
    void kimliksizIstekSayilmaz() throws Exception {
        filter.doFilterInternal(chatPost(), response, chain);

        verify(valueOps, never()).increment(anyString());
        verify(chain).doFilter(any(), any());
    }

    @Test
    void sadeceChatMesajUcunuKapsar() {
        MockHttpServletRequest baska = new MockHttpServletRequest("POST", "/api/v1/portfolio/me");
        baska.setRequestURI("/api/v1/portfolio/me");
        assertTrue(filter.shouldNotFilter(baska));

        MockHttpServletRequest getIstegi = new MockHttpServletRequest("GET", "/api/v1/chat/messages");
        getIstegi.setRequestURI("/api/v1/chat/messages");
        assertTrue(filter.shouldNotFilter(getIstegi));

        assertTrue(!filter.shouldNotFilter(chatPost()));
    }
}
