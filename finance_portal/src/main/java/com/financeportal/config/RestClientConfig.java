package com.financeportal.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * RestTemplate bean'ı merkezi olarak konfigüre edilir
 * Tüm HTTP API çağrıları bu bean'ı kullanırlar
 */
@Configuration
@Slf4j
public class RestClientConfig {

    /**
     * Optimized RestTemplate bean'ı
     * - Timeout: 10 saniye
     * - Connection handling
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(10))
                .requestFactory(this::clientHttpRequestFactory)
                .build();
    }

    /**
     * HTTP request factory (connection timeout ayarı)
     * Spring 6.1+ compatible
     */
    private ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);  // 10 saniye
        factory.setReadTimeout(10000);      // 10 saniye

        log.debug("RestTemplate ClientHttpRequestFactory konfigürasyonu yapıldı: 10s timeout");

        return factory;
    }
}

