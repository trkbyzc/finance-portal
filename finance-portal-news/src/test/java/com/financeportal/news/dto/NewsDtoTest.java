package com.financeportal.news.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * NewsDto'nun eşitlik/hashCode davranışı.
 *
 * <p>Bu test backend'deki {@code DtoFieldEqualityTest} ve {@code DtoExerciserTest}
 * içinden BURAYA TAŞINDI. Haber taşıyıcısı artık bu serviste yaşadığı için testinin
 * de burada olması gerekiyordu; ayırma sırasında kapsam kaybolmasın diye taşındı,
 * silinmedi.
 *
 * <p>Neden alan alan kontrol ediliyor: NewsDto Lombok ile üretilen equals/hashCode
 * kullanıyor. Bir alan yanlışlıkla dışarıda bırakılır ya da yeni bir alan eklenip
 * unutulursa iki farklı haber "aynı" sayılır; senkrondaki tekilleştirme sessizce
 * bozulur ve haberler kaybolur.
 */
class NewsDtoTest {

    private static NewsDto ornek() {
        return new NewsDto("Title", "Desc", "http://link", "2024-01-01", "Source", "http://img", "Cat");
    }

    @Test
    void ayniAlanlarEsit() {
        assertEquals(ornek(), ornek());
        assertEquals(ornek().hashCode(), ornek().hashCode());
    }

    @Test
    void herAlanFarkiEsitsizlikYaratir() {
        NewsDto base = ornek();
        assertNotEquals(base, new NewsDto("X", "Desc", "http://link", "2024-01-01", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "X", "http://link", "2024-01-01", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "X", "2024-01-01", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "X", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "2024-01-01", "X", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "2024-01-01", "Source", "X", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "2024-01-01", "Source", "http://img", "X"));
        assertNotEquals(base, new NewsDto());
        assertNotEquals(new NewsDto(), base);
    }

    @Test
    void setterlarleKurulanNesneKurucuylaAyniOlur() {
        NewsDto built = new NewsDto();
        built.setTitle("Title");
        built.setDescription("Desc");
        built.setLink("http://link");
        built.setPubDate("2024-01-01");
        built.setSource("Source");
        built.setImageUrl("http://img");
        built.setCategory("Cat");

        assertEquals(ornek(), built);
        assertEquals("Title", built.getTitle());
    }

    @Test
    void toStringPatlamaz() {
        assertNotNull(ornek().toString());
        assertNotNull(new NewsDto().toString());
    }
}
