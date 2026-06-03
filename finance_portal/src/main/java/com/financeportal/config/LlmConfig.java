package com.financeportal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * LLM provider çağrıları için ayrı bir RestTemplate.
 * Genel RestTemplate (10s timeout) LLM yanıtları için yetersiz —
 * burada tool çağrılı/uzun yanıtlar için 30s default ayarlıyoruz.
 */
@Configuration
public class LlmConfig {

    @Bean(name = "llmRestTemplate")
    public RestTemplate llmRestTemplate(RestTemplateBuilder builder,
                                        @Value("${app.llm.request-timeout-ms:30000}") long timeoutMs) {
        return builder
                .setConnectTimeout(Duration.ofMillis(Math.min(timeoutMs, 10_000)))
                .setReadTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }
}
