package com.financeportal.news.client;

import com.financeportal.news.dto.NewsDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.xml.parsers.DocumentBuilderFactory;
import java.net.HttpURLConnection;
import java.net.URI;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

@Component
@Slf4j
public class RssIntegrationClient {

    public List<NewsDto> fetchNewsFromSource(String url, String sourceName) {
        long startTime = System.currentTimeMillis();
        List<NewsDto> newsList = new ArrayList<>();
        try {
            Document document = fetchRssDocument(url);
            NodeList items = document.getElementsByTagName("item");

            for (int i = 0; i < items.getLength(); i++) {
                Element element = (Element) items.item(i);
                String link = getTagValue("link", element);
                if (link == null) continue;

                String title = getTagValue("title", element);
                String description = getTagValue("description", element);

                String contentEncoded = getTagValue("content:encoded", element);

                String rawPubDate = getTagValue("pubDate", element);
                String pubDate = normalizeDate(rawPubDate);

                String searchTargetForImage = (contentEncoded != null) ? contentEncoded : description;
                String imageUrl = extractImage(element, searchTargetForImage, link);

                String cleanDesc = cleanHtml(description);
                if (cleanDesc.isEmpty() && contentEncoded != null) {
                    cleanDesc = cleanHtml(contentEncoded);
                }

                // Başlıkta da entity olabilir (&amp; vb.) → aynı temizlikten geçir
                newsList.add(new NewsDto(cleanHtml(title), cleanDesc, link, pubDate, sourceName, imageUrl, ""));
            }
            log.info("[RSS] Fetched {} news articles from '{}' in {} ms.", newsList.size(), sourceName, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.warn("[RSS] Failed to fetch news from '{}': {}", sourceName, e.getMessage());
        }
        return newsList;
    }

    // =====================================================================
    // RSS feed'ler için trust-all SSL — BİLİNÇLİ GÜVENLİK KARARI
    // =====================================================================
    // SORUN: Habertürk gibi bazı RSS kaynakları JVM truststore'unda olmayan
    // CA'lar tarafından imzalanmış sertifika kullanır → 'PKIX path building failed'.
    //
    // KABUL EDİLEN RİSK: MITM saldırgan RSS içeriğini değiştirebilir
    // → görüntülenen haber başlığı/açıklaması manipüle edilebilir.
    //
    // RİSK SAVUNMASI:
    //  - Bu connection'da KİMLİK BİLGİSİ gönderilmiyor (token, cookie, basic auth yok).
    //  - RSS verisi sadece okunur (haber listesi). Tıklanan link'ler ayrı bir browser
    //    sekmesinde açılır — orada tarayıcı kendi cert validation'ını yapar.
    //  - JSoup ile HTML stripping (XSS guard) ve DocumentBuilderFactory XXE guard
    //    zaten devrede.
    //
    // ALTERNATİFLER REDDEDİLDİ:
    //  - JVM truststore'a manuel CA ekleme: her deploy ortamında manuel adım.
    //  - Self-signed CA whitelist: kaynak siteler periyodik olarak değişiyor.
    //  - RSS proxy servis: ekstra altyapı, demo için orantısız maliyet.
    //
    // KAPSAM: Sadece bu RssIntegrationClient instance'ı. Sistemin diğer HTTP
    // çağrıları (Keycloak, EVDS, LLM, mail, vb.) JVM default truststore'a sadık.
    @SuppressWarnings({
        "java:S4830", // Server certificate validation disabled — açıklama yukarıda
        "java:S5527"  // Hostname verification disabled    — açıklama yukarıda
    })
    private static final HostnameVerifier ACCEPT_ALL_HOSTS = (host, session) -> true;

    // AtomicReference: volatile + double-check kombinasyonu lint'çe weak çıkıyor
    // (S3077). Atomic ile compare-and-set semantics → tek seferlik init garantili.
    private static final AtomicReference<SSLSocketFactory> trustAllSocketFactoryRef = new AtomicReference<>();

    @SuppressWarnings({"java:S4830", "java:S5527"}) // X509TrustManager intentionally trust-all
    private static SSLSocketFactory getTrustAllSocketFactory() {
        SSLSocketFactory existing = trustAllSocketFactoryRef.get();
        if (existing != null) return existing;
        try {
            TrustManager[] trustAll = { new X509TrustManager() {
                @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                @Override public void checkClientTrusted(X509Certificate[] c, String a) { /* trust all — RSS public data */ }
                @Override public void checkServerTrusted(X509Certificate[] c, String a) { /* trust all — RSS public data */ }
            }};
            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, trustAll, new SecureRandom());
            SSLSocketFactory built = sc.getSocketFactory();
            // compareAndSet → başka thread bizden önce init ettiyse onun instance'ı kullanılır
            trustAllSocketFactoryRef.compareAndSet(null, built);
            return trustAllSocketFactoryRef.get();
        } catch (Exception e) {
            throw new IllegalStateException("RSS trust-all SSLContext oluşturulamadı", e);
        }
    }

    private Document fetchRssDocument(String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        if (conn instanceof HttpsURLConnection https) {
            https.setSSLSocketFactory(getTrustAllSocketFactory());
            https.setHostnameVerifier(ACCEPT_ALL_HOSTS);
        }

        // XXE (XML External Entity) koruması — OWASP standardı. Dış RSS XML'lerinden
        // <!DOCTYPE> / <!ENTITY> ile dosya okuma, SSRF, billion-laughs attack engellenir.
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
        dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        dbf.setXIncludeAware(false);
        dbf.setExpandEntityReferences(false);
        return dbf.newDocumentBuilder().parse(conn.getInputStream());
    }

    private String cleanHtml(String html) {
        if (html == null) return "";
        // Jsoup: HTML etiketlerini temizler VE sayısal/hex entity'leri decode eder
        // (örn. &#x1f6a8; → 🚨, &amp; → &, &nbsp; → boşluk). Önceki regex sadece etiket
        // siliyordu, bu yüzden CoinTurk gibi kaynaklardaki "&#x1f..." emoji kodları ham kalıyordu.
        return org.jsoup.Jsoup.parse(html).text().trim();
    }

    private String getTagValue(String tag, Element element) {
        NodeList nl = element.getElementsByTagName(tag);
        return (nl.getLength() > 0) ? nl.item(0).getTextContent() : null;
    }

    private String normalizeDate(String pubDate) {
        if (pubDate == null || pubDate.trim().isEmpty()) return getCurrentIsoDate();
        String[] formats = { "EEE, dd MMM yyyy HH:mm:ss Z", "dd.MM.yyyy HH:mm:ss", "yyyy-MM-dd HH:mm:ss" };
        for (String format : formats) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(format, Locale.ENGLISH);
                sdf.setTimeZone(TimeZone.getTimeZone("Europe/Istanbul"));
                return dateToIso(sdf.parse(pubDate.trim()));
            } catch (Exception ignored) {}
        }
        return getCurrentIsoDate();
    }

    private String dateToIso(Date date) {
        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
        isoFormat.setTimeZone(TimeZone.getTimeZone("Europe/Istanbul"));
        return isoFormat.format(date);
    }

    private String getCurrentIsoDate() { return dateToIso(new Date()); }

    private String extractImage(Element element, String descriptionHtml, String link) {
        NodeList enc = element.getElementsByTagName("enclosure");
        if (enc.getLength() > 0) return ((Element) enc.item(0)).getAttribute("url");

        NodeList media = element.getElementsByTagName("media:content");
        if (media.getLength() > 0) return ((Element) media.item(0)).getAttribute("url");

        NodeList thumb = element.getElementsByTagName("media:thumbnail");
        if (thumb.getLength() > 0) return ((Element) thumb.item(0)).getAttribute("url");

        if (descriptionHtml != null && descriptionHtml.contains("<img")) {
            try {
                org.jsoup.nodes.Document descDoc = org.jsoup.Jsoup.parse(descriptionHtml);
                org.jsoup.select.Elements imgs = descDoc.select("img");

                for (org.jsoup.nodes.Element img : imgs) {
                    String src = img.hasAttr("data-lazy-src") ? img.attr("data-lazy-src") :
                            img.hasAttr("data-src") ? img.attr("data-src") :
                                    img.attr("src");

                    if (src != null && !src.trim().isEmpty()) {
                        if (src.startsWith("//")) src = "https:" + src;
                        return src;
                    }
                }
            } catch (Exception ignored) {}
        }

        if (link != null && !link.isEmpty()) {
            try {
                org.jsoup.nodes.Document doc = org.jsoup.Jsoup.connect(link)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                        .header("Accept", "*/*")
                        .timeout(5000).get();

                org.jsoup.nodes.Element metaOgImage = doc.select("meta[property=og:image], meta[name=twitter:image]").first();
                if (metaOgImage != null && metaOgImage.hasAttr("content")) {
                    String src = metaOgImage.attr("content");
                    if (src.startsWith("//")) src = "https:" + src;
                    return src;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }
}