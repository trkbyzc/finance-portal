package com.financeportal.domains.news.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NewsCategoryClassifierTest {

    private final NewsCategoryClassifier classifier = new NewsCategoryClassifier();

    @Test
    void bitcoinTitle_classifiedAsKripto() {
        String result = classifier.assignCategory("Bitcoin yeni rekor kırdı", "BTC fiyatı 100k'yı geçti");
        assertEquals(NewsCategoryClassifier.KRIPTO, result);
    }

    @Test
    void bistInDescription_classifiedAsBorsa() {
        String result = classifier.assignCategory("Şirket haberi", "BIST 100 endeksi yükseldi");
        assertEquals(NewsCategoryClassifier.BORSA, result);
    }

    @Test
    void dolarKuru_classifiedAsDoviz() {
        String result = classifier.assignCategory("Dolar/TL", "Kur 35 lirayı gördü");
        assertEquals(NewsCategoryClassifier.DOVIZ, result);
    }

    @Test
    void altinFiyati_classifiedAsEmtialar() {
        String result = classifier.assignCategory("Altın haberleri", "Ons altın rekor seviyede");
        assertEquals(NewsCategoryClassifier.EMTIALAR, result);
    }

    @Test
    void tahvilKonusu_classifiedAsTahvil() {
        String result = classifier.assignCategory("Hazine ihalesi", "10 yıllık tahvil getirisi");
        assertEquals(NewsCategoryClassifier.TAHVIL, result);
    }

    @Test
    void tefasFonu_classifiedAsFonlar() {
        String result = classifier.assignCategory("Tefas fon performansı", "Yatırım fonu önerileri");
        assertEquals(NewsCategoryClassifier.FONLAR, result);
    }

    @Test
    void enflasyon_classifiedAsGenel() {
        String result = classifier.assignCategory("Enflasyon verisi açıklandı", "TÜFE %2.5 arttı");
        assertEquals(NewsCategoryClassifier.GENEL, result);
    }

    @Test
    void noMatchingKeyword_fallsBackToGenel() {
        String result = classifier.assignCategory("Hava güzel", "Bugün hava çok güzel");
        assertEquals(NewsCategoryClassifier.GENEL, result);
    }

    @Test
    void nullTitleAndDesc_doNotThrow_returnsGenel() {
        String result = classifier.assignCategory(null, null);
        assertEquals(NewsCategoryClassifier.GENEL, result);
    }

    @Test
    void cryptoBeatsFinanceKeywords_priorityOrder() {
        // Hem 'bitcoin' (kripto) hem 'borsa' geçiyor → kripto önce check edildiği için kazanır
        String result = classifier.assignCategory("Borsa ve Bitcoin", "Hisse senedi ve BTC karşılaştırması");
        assertEquals(NewsCategoryClassifier.KRIPTO, result);
    }
}
