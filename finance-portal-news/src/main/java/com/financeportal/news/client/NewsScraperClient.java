package com.financeportal.news.client;

import com.financeportal.news.config.DataSourceKeys;
import com.financeportal.news.config.DataSourcePolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NewsScraperClient {

    private final DataSourcePolicy dataSourcePolicy;

    public String scrapeArticleContent(String url) {
        // Kaynak bu ortamda sunulmuyorsa dis cagri hic yapilmaz.
        dataSourcePolicy.check(DataSourceKeys.NEWS_CONTENT);

        long startTime = System.currentTimeMillis();
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(10000)
                    .get();

            StringBuilder content = new StringBuilder();
            Elements paragraphs;

            if (url.contains("bloomberght.com")) {
                paragraphs = doc.select(".news-content p");
            } else if (url.contains("trthaber.com")) {
                paragraphs = doc.select(".news-detail-content p, .news-content p");
            } else if (url.contains("uzmancoin.com")) {
                paragraphs = doc.select(".post-content p, .entry-content p, article p");
            } else {
                paragraphs = doc.select("p");
            }

            for (Element p : paragraphs) {
                String text = p.text().trim();
                if (!text.isEmpty() && text.length() > 30 && !text.toLowerCase().contains("reklam")) {
                    content.append(text).append("\n\n");
                }
            }

            if (content.length() == 0) {
                log.debug("[NEWS] Could not extract content from URL: {}", url);
                return "Haberin detaylarına ulaşılamadı. Lütfen orijinal kaynağa gidiniz.";
            }

            log.debug("[NEWS] Scraped article content from {} in {} ms.", url, (System.currentTimeMillis() - startTime));
            return content.toString();

        } catch (Exception e) {
            log.error("[NEWS] Failed to scrape article content from URL {}: {}", url, e.getMessage());
            return "Haber metni çekilirken bir hata oluştu. Lütfen 'Orijinal Kaynağa Git' butonunu kullanınız.";
        }
    }
}