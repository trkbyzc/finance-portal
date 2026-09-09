package com.financeportal.config;

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
     * Önbellek için tip bilgisi taşıyan ayrı bir ObjectMapper üretir.
     *
     * <p><b>Çözdüğü sorun:</b> önceden bu serileştirici doğrudan uygulamanın ObjectMapper'ı
     * ile kuruluyordu. O mapper tip bilgisi yazmadığı için değerler {@code @class} alanı
     * olmadan saklanıyor, geri okunurken Jackson tipi bilemeyip {@code LinkedHashMap}
     * üretiyordu. Jenerik silme yüzünden derleyici bunu göremiyor; kod {@code List<XDto>}
     * sanıp ilk getter çağrısında {@code ClassCastException} alıyordu.
     *
     * <p>Canlıda üç ayrı belirtisi görüldü: altın yedeği aylarca sessizce bozuktu,
     * döviz kuru okunamıyordu ve {@code PortfolioPriceService.extractPriceFromList}
     * içine elle bir {@code instanceof LinkedHashMap} dalı eklenmişti.
     *
     * <p><b>İki kritik nokta:</b>
     * <ul>
     *   <li>Paylaşılan mapper {@code copy()} ile çoğaltılır, ASLA mutasyona uğratılmaz —
     *       aksi halde tüm HTTP yanıtlarına {@code @class} alanı sızardı.</li>
     *   <li>Tipleme sınırsız açılmaz; doğrulayıcı yalnızca bu uygulamanın ve JDK'nın
     *       temel paketlerine izin verir. Varsayılan tiplemenin bilinen riski, saldırganın
     *       kontrolündeki JSON ile keyfi sınıf oluşturulmasıdır; buradaki veriyi yalnızca
     *       uygulamanın kendisi yazıyor olsa da sınırı dar tutmak doğru olan.</li>
     * </ul>
     *
     * <p><b>Dağıtım etkisi:</b> mevcut önbellek kayıtları eski formatta ve okunamayacak.
     * {@code CacheService.get} bu hatayı yakalayıp boş liste döndüğü için her anahtar ilk
     * istekte yeniden çekilip yeni formatta yazılır — kendi kendini onarır, elle bir
     * temizlik gerekmez.
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

        // NON_FINAL değil EVERYTHING — bu seçim deneyerek bulundu, bkz. RedisConfigTest.
        //
        // NON_FINAL, final sınıflara tip bilgisi YAZMAZ ama okurken bekler. Bu önbellekte
        // saklanan değerlerin çoğu final: servisler `List.of(...)` / `.toList()` döndürüyor
        // (JDK'nın ImmutableCollections sınıfları final) ve haber senkronu düz bir String
        // yazıyor. NON_FINAL ile bunların hepsi okunamıyor, yani tüm önbellek bozuluyordu.
        cacheMapper.activateDefaultTyping(
                typeValidator,
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.PROPERTY);

        return cacheMapper;
    }
}
