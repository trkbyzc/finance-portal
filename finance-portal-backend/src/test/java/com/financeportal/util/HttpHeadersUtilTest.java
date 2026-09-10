package com.financeportal.util;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HttpHeadersUtilTest {

    @Test
    void standardHeaders_returnsUserAgentAcceptAndLanguage() {
        HttpHeaders headers = HttpHeadersUtil.getStandardHeaders();

        assertNotNull(headers);
        assertTrue(headers.getFirst("User-Agent").contains("Mozilla"));
        assertEquals("application/json", headers.getFirst("Accept"));
        assertEquals("tr-TR,tr;q=0.9", headers.getFirst("Accept-Language"));
        assertEquals("no-cache", headers.getFirst("Cache-Control"));
    }

    @Test
    void coinGeckoHeaders_inheritStandardAndKeepJsonAccept() {
        HttpHeaders headers = HttpHeadersUtil.getCoinGeckoHeaders();

        assertNotNull(headers.getFirst("User-Agent"));
        assertEquals("application/json", headers.getFirst("Accept"));
    }

    @Test
    void yahooFinanceHeaders_overrideAcceptWithWildcard() {
        HttpHeaders headers = HttpHeadersUtil.getYahooFinanceHeaders();

        assertEquals("application/json, text/plain, */*", headers.getFirst("Accept"));
    }

    @Test
    void tcmbHeaders_useXmlAccept() {
        HttpHeaders headers = HttpHeadersUtil.getTcmbHeaders();

        assertEquals("application/xml, text/xml, */*", headers.getFirst("Accept"));
    }

    @Test
    void evdsHeaders_setJsonAcceptAndContentType() {
        HttpHeaders headers = HttpHeadersUtil.getEvdsHeaders();

        assertEquals("application/json", headers.getFirst("Accept"));
        assertEquals("application/json", headers.getFirst("Content-Type"));
    }
}
