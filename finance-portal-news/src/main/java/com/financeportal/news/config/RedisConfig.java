package com.financeportal.news.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis ayarlari — backend'deki RedisConfig ile BILEREK AYNI.
 *
 * <p>Sebep: haber onbellegi (`cache:news:v16`) su anda canlida DOLU ve backend'in
 * serilestiricisiyle yazilmis. Burada farkli bir bicim secilseydi servis acildiginda
 * mevcut kaydi okuyamaz, haberler ilk senkron bitene kadar bos gorunurdu.
 * Ayni serilestiriciyle devraliniyor, kesinti olmuyor.
 *
 * <p>Not: bu servis RedisTemplate ile yalnizca duz bir JSON METNI sakliyor
 * (NewsSyncService kendi ObjectMapper'i ile ceviriyor). Yani tipleme ayarinin
 * pratikte tek islevi, backend'in yazdigi mevcut degeri ayni sekilde geri okumak.
 */
@Configuration
public class RedisConfig {

    private final ObjectMapper objectMapper;

    public RedisConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(cacheObjectMapper());
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);
        return template;
    }

    /**
     * Paylasilan mapper {@code copy()} ile cogaltilir, ASLA mutasyona ugratilmaz —
     * aksi halde tum HTTP yanitlarina tip alani sizardi.
     *
     * <p>NON_FINAL degil EVERYTHING: NON_FINAL final siniflara tip bilgisi yazmaz
     * ama okurken bekler; burada saklanan deger duz bir {@code String} (final),
     * yani NON_FINAL ile onbellek okunamaz hale gelirdi.
     */
    private ObjectMapper cacheObjectMapper() {
        ObjectMapper cacheMapper = objectMapper.copy();

        PolymorphicTypeValidator typeValidator = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.financeportal.")
                .allowIfSubType("java.util.")
                .allowIfSubType("java.time.")
                .allowIfSubType("java.math.")
                .allowIfSubType("java.lang.")
                .build();

        cacheMapper.activateDefaultTyping(
                typeValidator,
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.PROPERTY);

        return cacheMapper;
    }
}
