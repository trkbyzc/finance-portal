package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.portfolio.PortfolioDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.dto.portfolio.TransactionDto;
import com.financeportal.model.entity.Portfolio;
import com.financeportal.model.entity.Transaction;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.PortfolioRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PortfolioServiceTest {

    @Mock private PortfolioItemRepository portfolioItemRepo;
    @Mock private PortfolioRepository portfolioRepo;
    @Mock private TransactionRepository transactionRepo;
    @Mock private UserRepository userRepo;
    @Mock private SecurityUtils securityUtils;
    @Mock private PortfolioTradeService tradeService;
    @Mock private PortfolioAnalyticsService analyticsService;

    @InjectMocks private PortfolioService service;

    private UUID userId;
    private User user;
    private Portfolio defaultPortfolio;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        defaultPortfolio = new Portfolio(UUID.randomUUID(), user, "Ana Portföy", LocalDateTime.now());
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
    }

    // -------- listPortfolios --------

    @Test
    void list_userHasPortfolios_returnsAllWithItemCount() {
        Portfolio p2 = new Portfolio(UUID.randomUUID(), user, "Riskli", LocalDateTime.now());
        when(portfolioRepo.findByUser_IdOrderByCreatedAtAsc(userId))
                .thenReturn(List.of(defaultPortfolio, p2));
        when(portfolioItemRepo.findByPortfolio_Id(defaultPortfolio.getId())).thenReturn(List.of());
        when(portfolioItemRepo.findByPortfolio_Id(p2.getId())).thenReturn(List.of(
                new com.financeportal.model.entity.PortfolioItem(),
                new com.financeportal.model.entity.PortfolioItem()));

        List<PortfolioDto> result = service.listPortfolios();

        assertEquals(2, result.size());
        assertEquals(0, result.get(0).getItemCount());
        assertEquals(2, result.get(1).getItemCount());
    }

    @Test
    void list_noPortfolios_createsDefault() {
        when(portfolioRepo.findByUser_IdOrderByCreatedAtAsc(userId))
                .thenReturn(List.of()) // initial check
                .thenReturn(List.of(defaultPortfolio)); // after getOrCreateDefault
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(portfolioRepo.save(any(Portfolio.class))).thenReturn(defaultPortfolio);
        when(portfolioItemRepo.findByPortfolio_Id(any())).thenReturn(List.of());

        List<PortfolioDto> result = service.listPortfolios();

        verify(portfolioRepo).save(any(Portfolio.class));
        assertEquals(1, result.size());
    }

    // -------- createPortfolio --------

    @Test
    void create_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.createPortfolio("My"));
    }

    @Test
    void create_validName_savesWithTrimmedName() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(portfolioRepo.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));

        PortfolioDto result = service.createPortfolio("  Riskli Yatırımlar  ");

        assertEquals("Riskli Yatırımlar", result.getName());
        assertEquals(0, result.getItemCount());
    }

    @Test
    void create_nullName_defaultsToYeniPortfoy() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(portfolioRepo.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));

        PortfolioDto result = service.createPortfolio(null);
        assertEquals("Yeni Portföy", result.getName());

        result = service.createPortfolio("   ");
        assertEquals("Yeni Portföy", result.getName());
    }

    // -------- renamePortfolio --------

    @Test
    void rename_portfolioMissing_throws404() {
        UUID pid = defaultPortfolio.getId();
        when(portfolioRepo.findById(pid)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.renamePortfolio(pid, "X"));
    }

    @Test
    void rename_notOwned_throws404() {
        UUID pid = defaultPortfolio.getId();
        User other = new User();
        other.setId(UUID.randomUUID());
        defaultPortfolio.setUser(other);
        when(portfolioRepo.findById(pid)).thenReturn(Optional.of(defaultPortfolio));

        assertThrows(ResourceNotFoundException.class, () -> service.renamePortfolio(pid, "X"));
    }

    @Test
    void rename_validName_updatesAndSaves() {
        UUID pid = defaultPortfolio.getId();
        when(portfolioRepo.findById(pid)).thenReturn(Optional.of(defaultPortfolio));
        when(portfolioItemRepo.findByPortfolio_Id(pid)).thenReturn(List.of());

        PortfolioDto result = service.renamePortfolio(pid, "  Yeni İsim  ");

        assertEquals("Yeni İsim", result.getName());
        verify(portfolioRepo).save(defaultPortfolio);
    }

    @Test
    void rename_blankName_keepsOldName() {
        UUID pid = defaultPortfolio.getId();
        when(portfolioRepo.findById(pid)).thenReturn(Optional.of(defaultPortfolio));
        when(portfolioItemRepo.findByPortfolio_Id(pid)).thenReturn(List.of());

        service.renamePortfolio(pid, "   ");
        assertEquals("Ana Portföy", defaultPortfolio.getName());
    }

    // -------- deletePortfolio --------

    @Test
    void delete_lastPortfolio_throwsIllegalState() {
        UUID pid = defaultPortfolio.getId();
        when(portfolioRepo.findById(pid)).thenReturn(Optional.of(defaultPortfolio));
        when(portfolioRepo.countByUser_Id(userId)).thenReturn(1L);

        assertThrows(IllegalStateException.class, () -> service.deletePortfolio(pid));
        verify(portfolioRepo, never()).delete(any());
    }

    @Test
    void delete_notLast_deletesItemsThenPortfolio() {
        UUID pid = defaultPortfolio.getId();
        when(portfolioRepo.findById(pid)).thenReturn(Optional.of(defaultPortfolio));
        when(portfolioRepo.countByUser_Id(userId)).thenReturn(3L);
        List<com.financeportal.model.entity.PortfolioItem> items = List.of(
                new com.financeportal.model.entity.PortfolioItem());
        when(portfolioItemRepo.findByPortfolio_Id(pid)).thenReturn(items);

        service.deletePortfolio(pid);

        verify(portfolioItemRepo).deleteAll(items);
        verify(portfolioRepo).delete(defaultPortfolio);
    }

    // -------- addManualEntry (delegation) --------

    @Test
    void add_resolvesPortfolioAndDelegatesToTradeService() {
        TradeRequestDto req = new TradeRequestDto("BTC", AssetType.CRYPTO,
                new BigDecimal("1"), new BigDecimal("50000"), null, defaultPortfolio.getId(), null);
        when(portfolioRepo.findById(defaultPortfolio.getId())).thenReturn(Optional.of(defaultPortfolio));

        service.addManualEntry(req);

        verify(tradeService).executeManualEntry(userId, defaultPortfolio, req);
    }

    @Test
    void add_nullPortfolioId_usesDefault() {
        TradeRequestDto req = new TradeRequestDto("BTC", AssetType.CRYPTO,
                new BigDecimal("1"), new BigDecimal("50000"), null, null, null);
        when(portfolioRepo.findByUser_IdOrderByCreatedAtAsc(userId)).thenReturn(List.of(defaultPortfolio));

        service.addManualEntry(req);

        verify(tradeService).executeManualEntry(userId, defaultPortfolio, req);
    }

    @Test
    void update_delegatesToTradeService() {
        TradeRequestDto req = new TradeRequestDto("BTC", AssetType.CRYPTO,
                new BigDecimal("2"), new BigDecimal("55000"), null, defaultPortfolio.getId(), null);
        when(portfolioRepo.findById(defaultPortfolio.getId())).thenReturn(Optional.of(defaultPortfolio));

        service.updateManualEntry(req);
        verify(tradeService).executeUpdateManualEntry(defaultPortfolio, req);
    }

    @Test
    void remove_delegatesToTradeService() {
        TradeRequestDto req = new TradeRequestDto("BTC", AssetType.CRYPTO,
                new BigDecimal("1"), null, null, defaultPortfolio.getId(), null);
        when(portfolioRepo.findById(defaultPortfolio.getId())).thenReturn(Optional.of(defaultPortfolio));

        service.removeFromPortfolio(req);
        verify(tradeService).executeRemoveFromPortfolio(defaultPortfolio, req);
    }

    // -------- getMyPortfolio / getMyPortfolioSummary --------

    @Test
    void getMy_resolvesPortfolioAndDelegatesToAnalytics() {
        when(portfolioRepo.findById(defaultPortfolio.getId())).thenReturn(Optional.of(defaultPortfolio));
        when(portfolioItemRepo.findByPortfolio_Id(defaultPortfolio.getId())).thenReturn(List.of());
        when(analyticsService.buildPortfolioItems(any())).thenReturn(List.of());

        service.getMyPortfolio(defaultPortfolio.getId());
        verify(analyticsService).buildPortfolioItems(any());
    }

    @Test
    void getMySummary_delegatesToAnalytics() {
        when(portfolioRepo.findById(defaultPortfolio.getId())).thenReturn(Optional.of(defaultPortfolio));
        when(portfolioItemRepo.findByPortfolio_Id(defaultPortfolio.getId())).thenReturn(List.of());
        when(analyticsService.buildPortfolioSummary(any())).thenReturn(new PortfolioSummaryDto());

        service.getMyPortfolioSummary(defaultPortfolio.getId());
        verify(analyticsService).buildPortfolioSummary(any());
    }

    // -------- getMyTransactions (4 query routing) --------

    @Test
    void txn_noFilters_usesUserOnlyQuery() {
        when(transactionRepo.findByUser_IdOrderByExecutedAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<TransactionDto> result = service.getMyTransactions(null, null, null, 0, 10);

        assertNotNull(result);
        verify(transactionRepo).findByUser_IdOrderByExecutedAtDesc(eq(userId), any(Pageable.class));
    }

    @Test
    void txn_onlySymbol_usesSymbolQuery() {
        when(transactionRepo.findByUser_IdAndSymbolOrderByExecutedAtDesc(eq(userId), eq("BTC"), any()))
                .thenReturn(new PageImpl<>(List.of()));

        service.getMyTransactions("BTC", null, null, 0, 10);

        verify(transactionRepo).findByUser_IdAndSymbolOrderByExecutedAtDesc(eq(userId), eq("BTC"), any());
    }

    @Test
    void txn_onlyDateRange_usesDateQuery() {
        when(transactionRepo.findByUser_IdAndExecutedAtBetweenOrderByExecutedAtDesc(
                eq(userId), any(), any(), any())).thenReturn(new PageImpl<>(List.of()));

        service.getMyTransactions(null, LocalDate.now().minusDays(7), LocalDate.now(), 0, 10);

        verify(transactionRepo).findByUser_IdAndExecutedAtBetweenOrderByExecutedAtDesc(
                eq(userId), any(), any(), any());
    }

    @Test
    void txn_symbolAndDateRange_usesCombinedQuery() {
        when(transactionRepo.findByUser_IdAndSymbolAndExecutedAtBetweenOrderByExecutedAtDesc(
                eq(userId), eq("BTC"), any(), any(), any())).thenReturn(new PageImpl<>(List.of()));

        service.getMyTransactions("BTC", LocalDate.now().minusDays(7), LocalDate.now(), 0, 10);

        verify(transactionRepo).findByUser_IdAndSymbolAndExecutedAtBetweenOrderByExecutedAtDesc(
                eq(userId), eq("BTC"), any(), any(), any());
    }

    @Test
    void txn_blankSymbol_treatedAsNull() {
        when(transactionRepo.findByUser_IdOrderByExecutedAtDesc(eq(userId), any()))
                .thenReturn(new PageImpl<>(List.of()));

        service.getMyTransactions("   ", null, null, 0, 10);
        verify(transactionRepo).findByUser_IdOrderByExecutedAtDesc(eq(userId), any());
    }

    @Test
    void txn_transactionMappedToDto() {
        Transaction t = new Transaction();
        t.setId(UUID.randomUUID());
        t.setSymbol("BTC");
        t.setAssetType(AssetType.CRYPTO);
        t.setQuantity(new BigDecimal("1"));
        t.setPrice(new BigDecimal("50000"));
        t.setExecutedAt(LocalDateTime.now());
        t.setNotes("manual");
        when(transactionRepo.findByUser_IdOrderByExecutedAtDesc(eq(userId), any()))
                .thenReturn(new PageImpl<>(List.of(t)));

        Page<TransactionDto> result = service.getMyTransactions(null, null, null, 0, 10);

        assertEquals(1, result.getContent().size());
        assertEquals("BTC", result.getContent().get(0).getSymbol());
        assertEquals(AssetType.CRYPTO, result.getContent().get(0).getAssetType());
    }
}
