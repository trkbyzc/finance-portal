package com.financeportal.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserBanFilter userBanFilter;
    private final UserSyncFilter userSyncFilter; // 🚀 EKLENDİ - Senkronizasyon filtremiz
    private final SessionRevocationFilter sessionRevocationFilter; // Admin force-logout için

    /**
     * CORS allowed origin pattern listesi. Default sadece local dev (localhost/127.0.0.1, herhangi port).
     * Prod'da CORS_ALLOWED_ORIGINS env var ile gerçek domain'leri inject et (örn. https://app.example.com).
     * "*" KESİNLİKLE kullanma — allowCredentials=true ile birleşince CSRF zafiyetine açar (S5122).
     */
    @Value("${security.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*}")
    private String[] corsAllowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // NOT: Spring Security request matcher'lar Tomcat context-path'i (/api/v1) strip'ler.
                        // Bu yüzden pattern'lar /api/v1 ile değil, controller mapping'iyle aynı şekilde başlar.
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/market-data/**").permitAll()
                        .requestMatchers("/analysis/**").permitAll()
                        .requestMatchers("/news/**").permitAll()
                        .requestMatchers("/interest/**").permitAll()
                        .requestMatchers("/economic-calendar/**").permitAll()
                        // 🚀 DİKKAT: "/api/auth/**" ve "POST /api/users" silindi!
                        // Artık Keycloak harici arka kapıdan kimse kayıt veya token isteği atamaz.
                        .anyRequest().authenticated()
                )
                // 1. Token Geçerli mi? (Spring Security arka planda Keycloak ile kontrol eder)
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                // 2. Token geçerliyse, bu kullanıcı DB'de var mı diye bizim filtreye sok:
                .addFilterAfter(userSyncFilter, org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class)
                // 3. Kullanıcı var, peki banlı mı diye Ban kontrolüne sok:
                .addFilterAfter(userBanFilter, UserSyncFilter.class)
                // 4. Admin force-logout sonrası eski token'ları reddet (server-side revocation)
                .addFilterAfter(sessionRevocationFilter, UserBanFilter.class);

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();

        // Principal olarak "preferred_username" kullan (sub yerine)
        jwtAuthenticationConverter.setPrincipalClaimName("preferred_username");

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
        // Origin listesi env var'dan (CORS_ALLOWED_ORIGINS). "*" YASAK — allowCredentials=true ile
        // CSRF zafiyeti yaratır. Default sadece localhost (any port) dev için.
        configuration.setAllowedOriginPatterns(Arrays.asList(corsAllowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // Spring Security "PasswordEncoder" modülünü backendte sadece uyumluluk için tuttuk.
    // Aslında şifreleri Keycloak yönetiyor ama projenin başka yerlerinde (örn. eski Admin eklemeleri)
    // Dependency Injection gerektirdiği için bu bean burada durabilir.
    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}