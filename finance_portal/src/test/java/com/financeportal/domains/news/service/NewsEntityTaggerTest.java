package com.financeportal.domains.news.service;

import com.financeportal.domains.news.dto.NewsDto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class NewsEntityTaggerTest {

    private final NewsEntityTagger tagger = new NewsEntityTagger();

    private NewsDto news(String title, String desc) {
        NewsDto n = new NewsDto();
        n.setTitle(title);
        n.setDescription(desc);
        return n;
    }

    @Test
    void tagsStockFromTitleWithTurkishSuffix() {
        NewsDto n = news("Aselsan'ın yeni savunma sözleşmesi açıklandı", null);
        tagger.tag(n);
        assertEquals("ASELS.IS", n.getRelatedSymbol());
        assertEquals("STOCK", n.getRelatedCategory());
        assertEquals("Aselsan", n.getRelatedName());
    }

    @Test
    void longestAliasWinsOverGenericCurrency() {
        // Hem "aselsan" hem "dolar" geçiyor → daha spesifik (uzun) alias kazanır.
        NewsDto n = news("Aselsan dolar bazlı ihracat geliri açıkladı", null);
        tagger.tag(n);
        assertEquals("ASELS.IS", n.getRelatedSymbol());
    }

    @Test
    void wordBoundaryPreventsFalsePositive() {
        // "garantili" içinde "garanti" geçer ama kelime sınırı yok → eşleşmemeli.
        NewsDto n = news("Garantili getiri vaadi dolandırıcılığına dikkat", null);
        tagger.tag(n);
        assertNull(n.getRelatedSymbol());
    }

    @Test
    void tagsCryptoAndIndexAndCurrency() {
        NewsDto btc = news("Bitcoin yeni rekor kırdı", null);
        tagger.tag(btc);
        assertEquals("BTC", btc.getRelatedSymbol());
        assertEquals("CRYPTO", btc.getRelatedCategory());

        NewsDto bist = news("BIST 100 endeksi günü yükselişle kapattı", null);
        tagger.tag(bist);
        assertEquals("XU100", bist.getRelatedSymbol());
        assertEquals("INDEX", bist.getRelatedCategory());

        NewsDto usd = news("Dolar 45 lirayı aştı", null);
        tagger.tag(usd);
        assertEquals("USD", usd.getRelatedSymbol());
        assertEquals("CURRENCY", usd.getRelatedCategory());
    }

    @Test
    void macroNewsStaysUntagged() {
        NewsDto n = news("Enflasyon beklentilerin üzerinde geldi", "TÜFE aylık bazda arttı");
        tagger.tag(n);
        assertNull(n.getRelatedSymbol());
        assertNull(n.getRelatedCategory());
    }

    @Test
    void fallsBackToDescriptionWhenTitleHasNoMatch() {
        NewsDto n = news("Piyasalarda hareketli gün", "Türk Hava Yolları yeni uçak siparişi verdi");
        tagger.tag(n);
        assertEquals("THYAO.IS", n.getRelatedSymbol());
    }
}
