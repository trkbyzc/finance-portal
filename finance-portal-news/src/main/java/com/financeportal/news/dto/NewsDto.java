package com.financeportal.news.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NewsDto {
    private String title;
    private String description;
    private String link;
    private String pubDate;
    private String source;
    private String imageUrl;
    private String category;

    /** Translation cache — sync sırasında LibreTranslate'le doldurulur; null = henüz çevrilmedi. */
    private String titleEn;
    private String descriptionEn;
    private String categoryEn;

    /** İlgili varlık etiketi — NewsEntityTagger sync sırasında doldurur; null = spesifik eşleşme yok.
     *  Faz: haber → varlık grafiği navigasyonu ve varlık detayında "İlgili Haberler" filtresi. */
    private String relatedSymbol;    // nav sembolü, örn. ASELS.IS / BTC / USD / XU100
    private String relatedName;      // chip etiketi, örn. "Aselsan"
    private String relatedCategory;  // nav kategorisi: STOCK | CRYPTO | CURRENCY | INDEX

    /** Geriye dönük 7-arg kurucu — RssIntegrationClient ve eski testler için EN/related alanları null. */
    public NewsDto(String title, String description, String link, String pubDate,
                   String source, String imageUrl, String category) {
        this(title, description, link, pubDate, source, imageUrl, category,
                null, null, null, null, null, null);
    }
}
