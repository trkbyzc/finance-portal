package com.financeportal.domains.ipo.client;

import com.financeportal.domains.ipo.dto.IpoDto;
import com.financeportal.config.datasource.DataSourceKeys;
import com.financeportal.config.datasource.DataSourcePolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class IpoScraperClient {

    private final DataSourcePolicy dataSourcePolicy;

    public List<IpoDto> scrapeIPOCalendar() {
        // Kaynak bu ortamda sunulmuyorsa dis cagri hic yapilmaz.
        dataSourcePolicy.check(DataSourceKeys.IPO_SCRAPER);

        long startTime = System.currentTimeMillis();
        List<IpoDto> ipoList = new ArrayList<>();
        LocalDate today = LocalDate.now();

        try {
            Document doc = Jsoup.connect("https://halkarz.com/")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(30000).get();

            Elements links = doc.select("h3 > a");

            for (Element link : links) {
                String companyName = link.text().trim();
                String url = link.attr("abs:href");
                if (url == null || url.isEmpty()) {
                    url = link.attr("href");
                    if (!url.startsWith("http")) url = "https://halkarz.com" + (url.startsWith("/") ? "" : "/") + url;
                }

                if (companyName.isEmpty() || companyName.toLowerCase().contains("sonuçlandı")) continue;

                Element card = link.parent();
                int attempts = 0;
                while (card != null && card.select("time").isEmpty() && attempts < 6) {
                    card = card.parent();
                    attempts++;
                }

                if (card != null && !card.select("time").isEmpty()) {
                    String dateStr = card.select("time").text().trim();
                    String ticker = card.select(".il-bist-kod").text().trim();
                    if (ticker.isEmpty()) ticker = "IPO";

                    String price = "Belirsiz";
                    String fullText = card.text();

                    if (fullText.contains("Fiyat")) {
                        try {
                            String afterFiyat = fullText.substring(fullText.indexOf("Fiyat") + 5).trim();
                            if (afterFiyat.startsWith("ı")) afterFiyat = afterFiyat.substring(1).trim();
                            if (afterFiyat.startsWith(":")) afterFiyat = afterFiyat.substring(1).trim();
                            String[] words = afterFiyat.split("\\s+");
                            if (words.length > 0) {
                                price = words[0];
                                if (words.length > 1 && (words[1].equalsIgnoreCase("TL") || words[1].equals("₺"))) price += " " + words[1];
                            }
                        } catch (Exception ignored) {
                            // Fiyat metni parse edilemezse "Belirsiz" kalır, arz yine listelenir.
                        }
                    }

                    if (price.toLowerCase().contains("belirsiz") && url != null && !url.isEmpty()) {
                        try {
                            Document detailDoc = Jsoup.connect(url).userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)").timeout(10000).get();
                            String detailText = detailDoc.text();
                            int priceIndex = detailText.indexOf("Halka Arz Fiyatı");
                            if (priceIndex != -1) {
                                String sub = detailText.substring(priceIndex, Math.min(priceIndex + 100, detailText.length()));
                                if (sub.contains(":")) {
                                    String potentialPrice = sub.substring(sub.indexOf(":") + 1).trim();
                                    String[] words = potentialPrice.split("\\s+");
                                    if (words.length > 0 && !words[0].toLowerCase().contains("belirsiz")) {
                                        price = words[0];
                                        if (words.length > 1 && (words[1].equalsIgnoreCase("TL") || words[1].equals("₺"))) price += " " + words[1];
                                    }
                                }
                            }
                        } catch (Exception ignored) {
                            // Detay sayfası erişilemezse fiyat "Belirsiz" kalır; arz yine listelenir.
                        }
                    }

                    if (isFutureOrPresentIpo(dateStr, today)) {
                        ipoList.add(new IpoDto(companyName.replace("Halka Arz", "").trim(), ticker, dateStr, url, price, "Talep Toplama Bekleniyor"));
                    }
                }
            }
            log.info("[SCRAPER_IPO] Başarıyla {} adet güncel arz çekildi ({} ms).", ipoList.size(), (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[SCRAPER_IPO] Kazıma hatası: {}", e.getMessage());
        }
        return ipoList;
    }

    private boolean isFutureOrPresentIpo(String dateStr, LocalDate today) {
        try {
            String lowerDate = dateStr.toLowerCase();
            String[] months = {"ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"};
            int monthIdx = -1;
            for (int i = 0; i < months.length; i++) {
                if (lowerDate.contains(months[i])) { monthIdx = i + 1; break; }
            }
            // Ay bilgisi yoksa muhtemelen "Sonuçlandı" gibi bir durum — güvenli taraf: GÖSTERME.
            if (monthIdx == -1) return false;

            int year = today.getYear();
            Matcher ym = Pattern.compile("\\b(202[0-9])\\b").matcher(dateStr);
            if (ym.find()) year = Integer.parseInt(ym.group(1));

            // Yıl bilgisini stringten çıkar ki gün regex'i "2026"yı "20"+"26" diye yutmasın.
            // Word-boundary'li \\b\\d{1,2}\\b da güvenli, ikisini birlikte kullanıyoruz.
            String dayHaystack = dateStr.replaceAll("\\b202[0-9]\\b", "");
            int day = 1;
            Matcher dm = Pattern.compile("\\b(\\d{1,2})\\b").matcher(dayHaystack);
            int lastDayFound = -1;
            while (dm.find()) {
                int val = Integer.parseInt(dm.group(1));
                if (val >= 1 && val <= 31) lastDayFound = val;
            }
            if (lastDayFound != -1) day = lastDayFound;

            // Bitiş tarihi bugünden önce ise = arz bitti = gösterme.
            return !LocalDate.of(year, monthIdx, day).isBefore(today);
        } catch (Exception e) {
            return false;
        }
    }
}