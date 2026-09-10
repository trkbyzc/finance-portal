package com.financeportal.demo;

import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.entity.Portfolio;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.entity.User;
import com.financeportal.model.entity.WatchlistItem;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.PortfolioRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.repository.WatchlistItemRepository;
import com.financeportal.service.portfolio.PortfolioTradeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DemoPortfolioSeederTest {

    @Mock private UserRepository userRepository;
    @Mock private PortfolioRepository portfolioRepository;
    @Mock private PortfolioItemRepository portfolioItemRepository;
    @Mock private WatchlistItemRepository watchlistItemRepository;
    @Mock private PortfolioTradeService tradeService;

    private DemoPortfolioSeeder seeder;
    private User demoUser;

    @BeforeEach
    void setUp() {
        seeder = new DemoPortfolioSeeder(userRepository, portfolioRepository,
                portfolioItemRepository, watchlistItemRepository, tradeService);
        ReflectionTestUtils.setField(seeder, "demoUsername", "demouser");

        demoUser = new User();
        demoUser.setId(UUID.randomUUID());
        demoUser.setUsername("demouser");

        when(portfolioRepository.save(any(Portfolio.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(watchlistItemRepository.save(any(WatchlistItem.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(watchlistItemRepository.findByUser_IdAndSymbolAndAssetType(any(), anyString(), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("Boş hesapta 12 pozisyon ve 5 izleme kaydı oluşturur")
    void seedsWhenAccountIsEmpty() {
        when(userRepository.findByUsername("demouser")).thenReturn(Optional.of(demoUser));
        when(portfolioItemRepository.findByUser_Id(demoUser.getId())).thenReturn(List.of());
        when(portfolioRepository.findByUser_IdOrderByCreatedAtAsc(demoUser.getId())).thenReturn(List.of());

        seeder.seedOnStartup();

        verify(tradeService, times(12)).executeManualEntry(eq(demoUser.getId()), any(Portfolio.class), any());
        verify(watchlistItemRepository, times(5)).save(any(WatchlistItem.class));
    }

    /** Yeniden başlatmalar veri çoğaltmamalı; ziyaretçinin değişiklikleri de ezilmemeli. */
    @Test
    @DisplayName("Kullanıcının pozisyonu varsa hiçbir şey yazmaz")
    void doesNothingWhenUserAlreadyHasPositions() {
        when(userRepository.findByUsername("demouser")).thenReturn(Optional.of(demoUser));
        when(portfolioItemRepository.findByUser_Id(demoUser.getId()))
                .thenReturn(List.of(new PortfolioItem()));

        seeder.seedOnStartup();

        verifyNoInteractions(tradeService);
        verify(watchlistItemRepository, never()).save(any());
    }

    /**
     * users satırı Keycloak ilk girişinde oluşur. Tamamen boş bir veritabanında
     * tohumlayıcı çökmemeli, sessizce atlamalı.
     */
    @Test
    @DisplayName("Demo kullanıcısı yoksa sessizce atlar")
    void skipsWhenDemoUserMissing() {
        when(userRepository.findByUsername("demouser")).thenReturn(Optional.empty());

        seeder.seedOnStartup();

        verifyNoInteractions(tradeService);
        verifyNoInteractions(portfolioRepository);
    }

    /** Varsayılan portföy ilk API erişiminde otomatik yaratılmış olabilir; ikincisi açılmamalı. */
    @Test
    @DisplayName("Aynı isimli portföy varsa yenisini oluşturmaz")
    void reusesExistingPortfolioByName() {
        Portfolio existing = new Portfolio();
        existing.setId(UUID.randomUUID());
        existing.setUser(demoUser);
        existing.setName("Ana Portföy");

        when(userRepository.findByUsername("demouser")).thenReturn(Optional.of(demoUser));
        when(portfolioItemRepository.findByUser_Id(demoUser.getId())).thenReturn(List.of());
        when(portfolioRepository.findByUser_IdOrderByCreatedAtAsc(demoUser.getId()))
                .thenReturn(List.of(existing));

        seeder.seedOnStartup();

        // Yalnızca ikinci portföy ("Uzun Vade") yaratılır, "Ana Portföy" yeniden kullanılır.
        verify(portfolioRepository, times(1)).save(any(Portfolio.class));
    }

    /**
     * Pozisyonlar servis katmanı üzerinden yazılır ki işlem geçmişi de dolsun.
     * Alış tarihi geçmişte olmalı — reel getiri/enflasyon hesapları buna dayanıyor.
     */
    @Test
    @DisplayName("Her alım geçmiş tarihli ve pozitif miktar/fiyat ile yazılır")
    void writesPlausibleTrades() {
        when(userRepository.findByUsername("demouser")).thenReturn(Optional.of(demoUser));
        when(portfolioItemRepository.findByUser_Id(demoUser.getId())).thenReturn(List.of());
        when(portfolioRepository.findByUser_IdOrderByCreatedAtAsc(demoUser.getId())).thenReturn(List.of());

        seeder.seedOnStartup();

        ArgumentCaptor<TradeRequestDto> captor = ArgumentCaptor.forClass(TradeRequestDto.class);
        verify(tradeService, times(12)).executeManualEntry(any(), any(), captor.capture());

        assertThat(captor.getAllValues()).allSatisfy(req -> {
            assertThat(req.getSymbol()).isNotBlank();
            assertThat(req.getAssetType()).isNotNull();
            assertThat(req.getQuantity().signum()).isPositive();
            assertThat(req.getPrice().signum()).isPositive();
            assertThat(req.getPortfolioId()).isNotNull();
            assertThat(req.getPurchaseDate()).isBefore(java.time.LocalDate.now());
        });

        // Kâr da zarar da görünsün diye alış fiyatları bilerek karışık seçildi;
        // hepsi aynı sembol olsaydı dağılım grafiği tek dilim olurdu.
        assertThat(captor.getAllValues()).extracting(TradeRequestDto::getSymbol)
                .doesNotHaveDuplicates();
    }
}
