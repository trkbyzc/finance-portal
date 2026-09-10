package com.financeportal.util;

import org.springframework.http.HttpHeaders;

/**
 * HTTP request header'larını merkezileştiren utility class
 * Tüm API client'lar bu utility'den standard header'ları alırlar
 */
public class HttpHeadersUtil {

    private HttpHeadersUtil() {
        // Utility class, instantiation yapılmaz
    }

    // Bot-detection bypass: bazı API'ler (Yahoo Finance vb.) JDK default User-Agent'ı reddeder; gerçek browser UA zorunlu.
    public static HttpHeaders getStandardHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        headers.set("Accept", "application/json");
        headers.set("Accept-Language", "tr-TR,tr;q=0.9");
        headers.set("Cache-Control", "no-cache");
        return headers;
    }

    public static HttpHeaders getCoinGeckoHeaders() {
        HttpHeaders headers = getStandardHeaders();
        headers.set("Accept", "application/json");
        return headers;
    }

    public static HttpHeaders getYahooFinanceHeaders() {
        HttpHeaders headers = getStandardHeaders();
        headers.set("Accept", "application/json, text/plain, */*");
        return headers;
    }

    public static HttpHeaders getTcmbHeaders() {
        HttpHeaders headers = getStandardHeaders();
        headers.set("Accept", "application/xml, text/xml, */*");
        return headers;
    }

    public static HttpHeaders getEvdsHeaders() {
        HttpHeaders headers = getStandardHeaders();
        headers.set("Accept", "application/json");
        headers.set("Content-Type", "application/json");
        return headers;
    }
}

