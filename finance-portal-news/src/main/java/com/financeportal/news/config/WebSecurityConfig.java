package com.financeportal.news.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Bu servis kimlik dogrulamasi YAPMAZ — haberler herkese aciktir ve oyle kalmali.
 * Buradaki tek is, disariya acilmamasi gereken tek ucu kapatmak.
 *
 * <p>{@code POST /news/sync} haber toplamayi elle tetikler. Backend'de bu uc
 * {@code /news/**} kurali sayesinde HERKESE ACIKTI: internetteki herhangi biri
 * RSS toplamayi istedigi kadar tetikleyebilirdi. Zamanlanmis is zaten 15 dakikada
 * bir calistigi icin bunun disariya acik olmasinin hicbir faydasi yok.
 *
 * <p>Yerelde acik kalir (gelistirirken ceviri gecisini beklemeden tetiklemek pratik),
 * canlida kapalidir — {@code application-prod.yml} icinde
 * {@code app.news.allow-manual-sync: false}.
 */
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Value("${app.news.allow-manual-sync:true}")
    private boolean allowManualSync;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Durumsuz bir okuma servisi: oturum yok, dolayisiyla CSRF de anlamsiz.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    if (allowManualSync) {
                        auth.requestMatchers(HttpMethod.POST, "/news/sync").permitAll();
                    } else {
                        auth.requestMatchers(HttpMethod.POST, "/news/sync").denyAll();
                    }
                    auth.anyRequest().permitAll();
                });
        return http.build();
    }
}
