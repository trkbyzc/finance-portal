package com.financeportal.demo;

import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.entity.Portfolio;
import com.financeportal.model.entity.User;
import com.financeportal.model.entity.WatchlistItem;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.PortfolioRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.repository.WatchlistItemRepository;
import com.financeportal.service.portfolio.PortfolioTradeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Canlı demoda gösterilecek örnek portföyü bir kez oluşturur.
 *
 * <p><b>Neden gerekli:</b> canlı veritabanı sıfırdan kuruldu ve Flyway göçleri yalnızca
 * şema üretiyor. Demo hesabıyla giren ziyaretçi bomboş bir portföy görüyordu — oysa
 * vitrinin asıl anlattığı şey portföy yönetimi.
 *
 * <p><b>Yalnızca canlıda çalışır:</b> {@code app.demo.seed-portfolio} bayrağı sadece
 * {@code application-prod.yml} içinde açıktır. Yerel geliştirme ve testler etkilenmez;
 * bayrak tanımlı değilse bu bean hiç oluşturulmaz.
 *
 * <p><b>Idempotent:</b> hedef kullanıcının hiç pozisyonu yoksa yazar, aksi halde hiçbir
 * şey yapmaz. Yani yeniden başlatmalar veri çoğaltmaz ve ziyaretçilerin demo hesapta
 * yaptığı değişikliklerin üzerine yazmaz.
 *
 * <p><b>Neden servis katmanı üzerinden yazıyoruz:</b> pozisyonlar doğrudan repository ile
 * yazılsaydı işlem geçmişi (audit trail) boş kalırdı; bu projede daha önce tam olarak
 * "pozisyonlar var ama işlemler yok" tutarsızlığı yaşandı.
 * {@link PortfolioTradeService#executeManualEntry} ikisini birlikte, aynı ortalama-maliyet
 * kuralıyla yazar — gerçek bir kullanıcının yapacağı alımdan farkı yoktur.
 *
 * <p><b>Bilinçli kapsam dışı:</b> VİOP ve tahvil pozisyonu tohumlanmaz. VİOP kontratları
 * bir sonraki vade ayında uzlaşma işiyle kapanır ve demo portföyü zamanla bozulurdu;
 * tahviller ise getiri-kotalı modellenir ve yanlış kurgulanmış bir satır hiç olmamasından
 * kötüdür. Her iki özellik de piyasa sayfalarında zaten görünür durumda.
 *
 * <p><b>Sınır:</b> uygulamadaki {@code users} satırı, kullanıcı Keycloak ile ilk kez giriş
 * yaptığında oluşur. Tamamen boş bir veritabanında bu tohumlayıcı ilk açılışta hedef
 * kullanıcıyı bulamaz ve atlar; demo hesabıyla bir kez giriş yapıp backend yeniden
 * başlatıldığında çalışır. Durumu INFO seviyesinde loglar.
 */
@Component
@ConditionalOnProperty(name = "app.demo.seed-portfolio", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DemoPortfolioSeeder {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioItemRepository portfolioItemRepository;
    private final WatchlistItemRepository watchlistItemRepository;
    private final PortfolioTradeService tradeService;

    @Value("${app.demo.seed-username:demouser}")
    private String demoUsername;

    /** Tohumlanacak tek bir alım. */
    private record Holding(String symbol, AssetType assetType, String quantity, String price, LocalDate boughtOn) {}

    private static final String MAIN_PORTFOLIO = "Ana Portföy";
    private static final String SECOND_PORTFOLIO = "Uzun Vade";

    /**
     * Ana portföy — ağırlıklı olarak BİST, yanında altın, döviz, fon ve bir miktar kripto.
     * Alış fiyatları bilerek karışık: bir kısmı kârda, bir kısmı zararda. Hepsi kârda olsaydı
     * ekran gerçekçi durmazdı ve zarar renklendirmesi/negatif yüzde biçimlendirmesi hiç
     * görünmezdi.
     *
     * <p>Semboller canlı {@code /market-data/all} çıktısına karşı doğrulandı; hepsinin fiyatı
     * çözümleniyor. Fiyatı çözülemeyen bir sembol portföyde "—" olarak durur.
     */
    private static final List<Holding> MAIN_HOLDINGS = List.of(
            new Holding("THYAO.IS",   AssetType.STOCK,     "150",  "268.40",  LocalDate.of(2026, 3, 12)),
            new Holding("ASELS.IS",   AssetType.STOCK,     "80",   "410.00",  LocalDate.of(2026, 5, 4)),
            new Holding("BIMAS.IS",   AssetType.STOCK,     "25",   "545.00",  LocalDate.of(2026, 1, 23)),
            new Holding("EREGL.IS",   AssetType.STOCK,     "1200", "36.20",   LocalDate.of(2026, 2, 17)),
            new Holding("TUPRS.IS",   AssetType.STOCK,     "200",  "181.50",  LocalDate.of(2026, 6, 9)),
            new Holding("GRAM_ALTIN", AssetType.COMMODITY, "30",   "5940.00", LocalDate.of(2025, 11, 6)),
            new Holding("USD",        AssetType.CURRENCY,  "5000", "44.20",   LocalDate.of(2026, 4, 2)),
            new Holding("AAK",        AssetType.FUND,      "2500", "31.80",   LocalDate.of(2026, 2, 28)),
            new Holding("BTC",        AssetType.CRYPTO,    "0.15", "71500.0", LocalDate.of(2026, 7, 21))
    );

    /** İkinci portföy — birden fazla portföy desteğinin görünmesi için küresel ağırlıklı. */
    private static final List<Holding> SECOND_HOLDINGS = List.of(
            new Holding("AAPL", AssetType.STOCK, "40",  "205.00", LocalDate.of(2026, 1, 15)),
            new Holding("NVDA", AssetType.STOCK, "120", "98.50",  LocalDate.of(2025, 12, 3)),
            new Holding("SPY",  AssetType.FUND,  "15",  "498.00", LocalDate.of(2026, 3, 30))
    );

    /** İzleme listesi — portföyde olmayan, "takip ediliyor" hissi veren semboller. */
    private static final List<Holding> WATCHLIST = List.of(
            new Holding("GARAN.IS", AssetType.STOCK,    null, null, null),
            new Holding("TCELL.IS", AssetType.STOCK,    null, null, null),
            new Holding("ETH",      AssetType.CRYPTO,   null, null, null),
            new Holding("EUR",      AssetType.CURRENCY, null, null, null),
            new Holding("TP2",      AssetType.FUND,     null, null, null)
    );

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedOnStartup() {
        User user = userRepository.findByUsername(demoUsername).orElse(null);
        if (user == null) {
            log.info("[DEMO-SEED] '{}' uygulama veritabanında yok — tohumlama atlandı. "
                    + "Kullanıcı satırı Keycloak ile ilk girişte oluşur; bir kez giriş yapıp "
                    + "backend yeniden başlatıldığında bu tohumlama çalışacaktır.", demoUsername);
            return;
        }

        if (!portfolioItemRepository.findByUser_Id(user.getId()).isEmpty()) {
            log.debug("[DEMO-SEED] '{}' zaten pozisyona sahip — tohumlama atlandı.", demoUsername);
            return;
        }

        Portfolio main = resolvePortfolio(user, MAIN_PORTFOLIO);
        Portfolio second = resolvePortfolio(user, SECOND_PORTFOLIO);

        int written = seedHoldings(user, main, MAIN_HOLDINGS) + seedHoldings(user, second, SECOND_HOLDINGS);
        int watched = seedWatchlist(user);

        log.info("[DEMO-SEED] '{}' için {} pozisyon ({} + {}) ve {} izleme kaydı oluşturuldu.",
                demoUsername, written, MAIN_HOLDINGS.size(), SECOND_HOLDINGS.size(), watched);
    }

    /**
     * Var olan portföyü adıyla bulur, yoksa oluşturur.
     *
     * <p>Kullanıcının varsayılan portföyü ilk API erişiminde otomatik yaratılmış olabilir;
     * aynı isimde ikinci bir tane açmamak için önce mevcutlara bakılır.
     */
    private Portfolio resolvePortfolio(User user, String name) {
        return portfolioRepository.findByUser_IdOrderByCreatedAtAsc(user.getId()).stream()
                .filter(p -> name.equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Portfolio p = new Portfolio();
                    p.setId(UUID.randomUUID());
                    p.setUser(user);
                    p.setName(name);
                    p.setCreatedAt(LocalDateTime.now());
                    return portfolioRepository.save(p);
                });
    }

    private int seedHoldings(User user, Portfolio portfolio, List<Holding> holdings) {
        int count = 0;
        for (Holding h : holdings) {
            TradeRequestDto request = new TradeRequestDto();
            request.setSymbol(h.symbol());
            request.setAssetType(h.assetType());
            request.setQuantity(new BigDecimal(h.quantity()));
            request.setPrice(new BigDecimal(h.price()));
            request.setPortfolioId(portfolio.getId());
            // Geçmiş bir alış tarihi: reel getiri / enflasyon hesapları anlamlı çalışsın.
            request.setPurchaseDate(h.boughtOn());

            tradeService.executeManualEntry(user.getId(), portfolio, request);
            count++;
        }
        return count;
    }

    private int seedWatchlist(User user) {
        int count = 0;
        for (Holding w : WATCHLIST) {
            boolean exists = watchlistItemRepository
                    .findByUser_IdAndSymbolAndAssetType(user.getId(), w.symbol(), w.assetType())
                    .isPresent();
            if (exists) continue;

            WatchlistItem item = new WatchlistItem();
            item.setId(UUID.randomUUID());
            item.setUser(user);
            item.setSymbol(w.symbol());
            item.setAssetType(w.assetType());
            item.setAddedAt(LocalDateTime.now());
            watchlistItemRepository.save(item);
            count++;
        }
        return count;
    }
}
