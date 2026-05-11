package com.financeportal.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // @PreAuthorize("hasRole('ADMIN')") anotasyonunun çalışmasını sağlar
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserBanFilter userBanFilter; // KAPIDAKİ FEDAİYİ ÇAĞIRDIK

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/market-data/**").permitAll()
                        .requestMatchers("/api/analysis/**").permitAll()
                        .requestMatchers("/api/news/**").permitAll()
                        .requestMatchers("/api/interest/**").permitAll() // 🚀 YENİ: FAİZ MODÜLÜNE HERKES GİREBİLİR!
                        .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                        .requestMatchers("/api/auth/**").permitAll() // HIZLI TOKEN ALMA ENDPOINTLERİ
                        .anyRequest().authenticated()
                )
                // KEYCLOAK ROL DÖNÜŞTÜRÜCÜSÜ EKLENDİ
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                // FEDAİYİ KAPININ ÖNÜNE (TOKEN KONTROLÜNDEN HEMEN SONRAYA) DİKTİK
                .addFilterAfter(userBanFilter, org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class);

        return http.build();
    }

    // Keycloak'un karmaşık rol yapısını, Spring Boot'un anladığı "ROLE_ADMIN" formatına çeviren sihirli metod
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();

        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = grantedAuthoritiesConverter.convert(jwt);
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                ((List<String>) realmAccess.get("roles")).forEach(role ->
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                );
            }
            return authorities;
        });
        return jwtAuthenticationConverter;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Bütün origin kalıplarına izin ver (localhost, 127.0.0.1, farklı portlar vs. hepsini kapsar)
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}