package com.financeportal.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.stock.dto.StockDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Bu testler serileştiricinin gidiş-dönüşünü ölçer.
 *
 * <p>Önbellekten dönen değerler eskiden {@code LinkedHashMap} oluyordu ve bu canlıda üç
 * ayrı hataya yol açtı (altın yedeği, döviz kuru okuma, portföy fiyat çözümü). Buradaki
 * asıl soru "JSON doğru mu" değil, <b>gerçek tipin geri geliyor mu</b>.
 *
 * <p>Özellikle değiştirilemez listeler kritik: servisler {@code List.of(...)} ve
 * {@code .toList()} döndürüyor, varsayılan tipleme ise değerin ÇALIŞMA ZAMANI sınıfını
 * yazıyor ({@code ImmutableCollections$ListN} gibi). Jackson bunları geri kuramasaydı
 * değişiklik canlıda tüm önbelleği bozardı.
 */
class RedisConfigTest {

    private RedisSerializer<Object> serializer;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        ObjectMapper appMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        RedisConfig config = new RedisConfig(appMapper);
        RedisTemplate<String, Object> template = config.redisTemplate(mock(RedisConnectionFactory.class));
        serializer = (RedisSerializer<Object>) template.getValueSerializer();

        // Paylaşılan mapper'ın mutasyona uğramadığını doğrulamak için sakla.
        ReflectionTestUtils.setField(this, "appMapper", appMapper);
    }

    private ObjectMapper appMapper;

    private Object roundTrip(Object value) {
        return serializer.deserialize(serializer.serialize(value));
    }

    @Test
    @DisplayName("DTO listesi gerçek tipiyle geri gelir, LinkedHashMap değil")
    void dtoListSurvivesRoundTrip() {
        CommodityDto gold = new CommodityDto();
        gold.setSymbol("GC=F");
        gold.setName("Altın (ONS)");
        gold.setPrice(new BigDecimal("2570.49"));

        Object back = roundTrip(new ArrayList<>(List.of(gold)));

        assertThat(back).isInstanceOf(List.class);
        List<?> list = (List<?>) back;
        assertThat(list).hasSize(1);
        assertThat(list.get(0))
                .isInstanceOf(CommodityDto.class)
                .extracting(o -> ((CommodityDto) o).getSymbol())
                .isEqualTo("GC=F");
    }

    /**
     * Servisler çoğunlukla {@code List.of(...)} / {@code .toList()} döndürüyor.
     * Bunlar JDK'nın değiştirilemez sınıfları; geri kurulamazsa canlıda TÜM önbellek bozulur.
     */
    @Test
    @DisplayName("Değiştirilemez listeler (List.of / toList) geri kurulabilir")
    void immutableListsSurviveRoundTrip() {
        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("48.46"));

        for (List<CurrencyDto> variant : List.of(
                List.of(usd),                                   // ImmutableCollections$List12
                List.of(usd, usd),                              // ImmutableCollections$List12
                List.of(usd, usd, usd),                         // ImmutableCollections$ListN
                Stream.of(usd).toList())) {                     // Stream.toList()

            Object back = roundTrip(variant);

            assertThat(back).as("tip: %s", variant.getClass().getName()).isInstanceOf(List.class);
            assertThat(((List<?>) back).get(0)).isInstanceOf(CurrencyDto.class);
        }
    }

    @Test
    @DisplayName("Boş liste sorunsuz gider gelir")
    void emptyListSurvivesRoundTrip() {
        assertThat(roundTrip(List.of())).isInstanceOf(List.class);
        assertThat((List<?>) roundTrip(List.of())).isEmpty();
    }

    @Test
    @DisplayName("BigDecimal hassasiyeti korunur — fiyat verisi float'a düşmemeli")
    void bigDecimalPrecisionIsPreserved() {
        StockDto stock = new StockDto();
        stock.setSymbol("THYAO.IS");
        stock.setPrice(new BigDecimal("300.1235"));

        List<?> back = (List<?>) roundTrip(new ArrayList<>(List.of(stock)));
        StockDto restored = (StockDto) back.get(0);

        assertThat(restored.getPrice()).isEqualByComparingTo(new BigDecimal("300.1235"));
        assertThat(restored.getPrice()).isInstanceOf(BigDecimal.class);
    }

    /**
     * Paylaşılan mapper mutasyona uğrarsa tüm HTTP yanıtlarına {@code @class} alanı sızar.
     * copy() kullanıldığını burada kanıtlıyoruz.
     */
    @Test
    @DisplayName("Uygulamanın paylaşılan mapper'ı değiştirilmez")
    void sharedApplicationMapperIsNotMutated() throws Exception {
        CommodityDto dto = new CommodityDto();
        dto.setSymbol("GC=F");

        String httpJson = appMapper.writeValueAsString(List.of(dto));

        assertThat(httpJson)
                .as("HTTP yanıtında tip bilgisi olmamalı")
                .doesNotContain("@class")
                .contains("GC=F");
    }

    /**
     * NewsSyncService onbellege duz bir JSON STRING yaziyor. String final bir tip;
     * tipleme final siniflari atlarsa yazarken tip bilgisi konmaz ama okurken beklenir
     * ve haber onbellegi tamamen bozulur.
     */
    @Test
    @DisplayName("Duz String degeri gider gelir (haber onbellegi bunu kullaniyor)")
    void plainStringSurvivesRoundTrip() {
        String json = "[{\"title\":\"Test haber\"}]";

        Object back = roundTrip(json);

        assertThat(back).isInstanceOf(String.class).isEqualTo(json);
    }
}
