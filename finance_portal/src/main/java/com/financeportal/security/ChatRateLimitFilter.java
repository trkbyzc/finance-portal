package com.financeportal.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

/**
 * Asistan mesajlarina kullanici basina hiz siniri koyar.
 *
 * <p><b>Neden var:</b> {@code /chat/messages} her cagrisinda bir LLM saglayicisina
 * (Gemini/Groq) istek gidiyor ve bu, hesabin gunluk kotasindan dusuyor. Uc kimlik
 * dogrulamasi istiyor ama bu tek basina koruma degil: demo hesabinin sifresi
 * (demouser / test123) README'de ve link onizleme kartinda herkese acik yaziyor.
 * Yani "giris yapabilen herkes" pratikte "herkes" demek. Sinirsiz birakildiginda
 * tek bir dongu birkac dakikada gunluk kotayi tuketip asistani herkes icin
 * calismaz hale getirebilir.
 *
 * <p><b>Neden Redis:</b> sayaclar surecin disinda durur; uygulama yeniden baslasa
 * da sinir korunur ve ileride birden fazla ornek calisirsa dogru toplam verir.
 *
 * <p><b>Ariza durusu — ACIK kalir:</b> Redis'e ulasilamazsa istek gecirilir.
 * Onbellek katmani coktugu icin asistanin tamamen susmasi, kota riskinden daha
 * kotu bir sonuc olurdu.
 *
 * <p><b>Neden IP'ye gore degil de kullaniciya gore sayiyor:</b> demo hesabi paylasimli
 * oldugu icin IP basina saymak daha adil olurdu, ama istemci {@code X-Forwarded-For}
 * basligini kendi uydurabiliyor (Caddy mevcut basliga EKLIYOR, uzerine yazmiyor).
 * Atlatilabilen bir sinir, hic olmayan sinirdan daha kotudur: guvendesin sanirsin.
 * Amac zaten adil paylasim degil, kotanin TAVANINI cizmek — kac saldirgan olursa
 * olsun gunluk yakim {@code per-day} ile sinirli kalir.
 *
 * <p>Yerel calistirmada devre disi: {@code app.chat.rate-limit.enabled} temel
 * profilde {@code false}, yalnizca {@code prod} profilinde acik.
 */
@Component
@ConditionalOnProperty(name = "app.chat.rate-limit.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class ChatRateLimitFilter extends OncePerRequestFilter {

    private static final String PATH = "/chat/messages";

    private final StringRedisTemplate redis;

    @Value("${app.chat.rate-limit.per-minute:10}")
    private int perMinute;

    @Value("${app.chat.rate-limit.per-day:200}")
    private int perDay;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !("POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().endsWith(PATH));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String userId = currentUserId();

        // Kimlik yoksa sayma: Spring Security bu istegi zaten 401 ile reddedecek.
        // Saymak, tum anonim istekleri ayni sayaca yigip birbirini engellemesine yol acardi.
        if (userId == null) {
            chain.doFilter(request, response);
            return;
        }

        long now = Instant.now().getEpochSecond();

        if (exceeded(userId, "m", now / 60, perMinute, Duration.ofMinutes(2))) {
            log.info("Asistan hiz siniri (dakika) asildi: kullanici={}", userId);
            reject(response, "Çok hızlı mesaj gönderiyorsunuz. Lütfen biraz bekleyin.", 60);
            return;
        }

        if (exceeded(userId, "d", now / 86_400, perDay, Duration.ofDays(2))) {
            log.info("Asistan hiz siniri (gun) asildi: kullanici={}", userId);
            reject(response, "Günlük asistan mesaj hakkınız doldu. Yarın tekrar deneyebilirsiniz.", 3_600);
            return;
        }

        chain.doFilter(request, response);
    }

    /** JWT'deki {@code sub} iddiasi; token yoksa null. */
    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt) {
            return jwt.getToken().getClaimAsString("sub");
        }
        return null;
    }

    /**
     * Pencere sayacini bir artirir ve siniri asip asmadigini soyler.
     * TTL yalnizca sayac ilk kez olusturuldugunda yazilir; her istekte yazmak
     * pencereyi surekli ileri kaydirir ve siniri etkisiz birakirdi.
     */
    private boolean exceeded(String userId, String scope, long window, int limit, Duration ttl) {
        String key = "rl:chat:" + userId + ":" + scope + ":" + window;
        try {
            Long count = redis.opsForValue().increment(key);
            if (count == null) return false;
            if (count == 1L) {
                redis.expire(key, ttl);
            }
            return count > limit;
        } catch (Exception e) {
            log.warn("Hiz sinirlama sayaci okunamadi ({}), istek gecirildi: {}", key, e.getMessage());
            return false;
        }
    }

    private void reject(HttpServletResponse response, String message, long retryAfterSeconds) throws IOException {
        response.setStatus(429); // HttpStatus.TOO_MANY_REQUESTS
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.getWriter().write("{\"error\":\"" + message + "\",\"code\":\"RATE_LIMITED\"}");
    }
}
