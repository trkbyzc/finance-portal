package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.entity.Portfolio;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.entity.Transaction;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.AssetType;
import com.financeportal.model.enums.TradeSide;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PortfolioTradeServiceTest {

    @Mock private PortfolioItemRepository itemRepo;
    @Mock private UserRepository userRepo;
    @Mock private TransactionRepository txRepo;

    @InjectMocks private PortfolioTradeService service;

    private UUID userId;
    private User user;
    private Portfolio portfolio;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        portfolio = new Portfolio(UUID.randomUUID(), user, "Default", java.time.LocalDateTime.now());
        // Default feature flag = true
        ReflectionTestUtils.setField(service, "transactionWriteEnabled", true);
    }

    // -------- executeManualEntry --------

    @Test
    void manualEntry_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        TradeRequestDto req = makeReq("BTC", "1", "50000", null);
        assertThrows(ResourceNotFoundException.class,
                () -> service.executeManualEntry(userId, portfolio, req));
    }

    @Test
    void manualEntry_newItem_createsWithQuantityAndPrice() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(itemRepo.findByPortfolio_IdAndSymbol(portfolio.getId(), "BTC")).thenReturn(Optional.empty());
        TradeRequestDto req = makeReq("BTC", "2", "50000", null);

        service.executeManualEntry(userId, portfolio, req);

        ArgumentCaptor<PortfolioItem> cap = ArgumentCaptor.forClass(PortfolioItem.class);
        verify(itemRepo).save(cap.capture());
        PortfolioItem saved = cap.getValue();
        assertEquals("BTC", saved.getSymbol());
        assertEquals(new BigDecimal("2"), saved.getQuantity());
        assertEquals(new BigDecimal("50000"), saved.getAveragePrice());
        assertEquals(BigDecimal.ONE, saved.getContractSize()); // default
    }

    @Test
    void manualEntry_newItemWithContractSize_snapshots() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(itemRepo.findByPortfolio_IdAndSymbol(portfolio.getId(), "F_XU030")).thenReturn(Optional.empty());
        TradeRequestDto req = makeReq("F_XU030", "1", "400", "10");

        service.executeManualEntry(userId, portfolio, req);

        ArgumentCaptor<PortfolioItem> cap = ArgumentCaptor.forClass(PortfolioItem.class);
        verify(itemRepo).save(cap.capture());
        assertEquals(new BigDecimal("10"), cap.getValue().getContractSize());
    }

    @Test
    void manualEntry_existingItem_updatesAvgCost() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        PortfolioItem existing = new PortfolioItem();
        existing.setSymbol("BTC");
        existing.setAssetType(AssetType.CRYPTO);
        existing.setQuantity(new BigDecimal("1"));
        existing.setAveragePrice(new BigDecimal("40000"));
        existing.setUser(user);
        when(itemRepo.findByPortfolio_IdAndSymbol(portfolio.getId(), "BTC")).thenReturn(Optional.of(existing));
        TradeRequestDto req = makeReq("BTC", "1", "60000", null);

        service.executeManualEntry(userId, portfolio, req);

        // Yeni quantity = 2, yeni avg = (1*40000 + 1*60000) / 2 = 50000
        assertEquals(new BigDecimal("2"), existing.getQuantity());
        assertEquals(new BigDecimal("50000.0000"), existing.getAveragePrice());
    }

    @Test
    void manualEntry_writesTransaction_whenEnabled() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.empty());

        service.executeManualEntry(userId, portfolio, makeReq("BTC", "1", "50000", null));

        ArgumentCaptor<Transaction> txCap = ArgumentCaptor.forClass(Transaction.class);
        verify(txRepo).save(txCap.capture());
        assertEquals(TradeSide.BUY, txCap.getValue().getSide());
        assertEquals("BTC", txCap.getValue().getSymbol());
    }

    @Test
    void manualEntry_doesNotWriteTransaction_whenFeatureDisabled() {
        ReflectionTestUtils.setField(service, "transactionWriteEnabled", false);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.empty());

        service.executeManualEntry(userId, portfolio, makeReq("BTC", "1", "50000", null));

        verify(txRepo, never()).save(any());
    }

    // -------- executeUpdateManualEntry --------

    @Test
    void update_itemMissing_throws404() {
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.empty());
        TradeRequestDto req = makeReq("BTC", "1", "50000", null);
        assertThrows(ResourceNotFoundException.class,
                () -> service.executeUpdateManualEntry(portfolio, req));
    }

    @Test
    void update_quantityIncrease_emitsBuyTransaction() {
        PortfolioItem item = mkItem("BTC", "1", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));

        service.executeUpdateManualEntry(portfolio, makeReq("BTC", "3", "50000", null));

        assertEquals(new BigDecimal("3"), item.getQuantity());
        assertEquals(new BigDecimal("50000"), item.getAveragePrice());

        ArgumentCaptor<Transaction> tx = ArgumentCaptor.forClass(Transaction.class);
        verify(txRepo).save(tx.capture());
        assertEquals(TradeSide.BUY, tx.getValue().getSide());
        assertEquals(new BigDecimal("2"), tx.getValue().getQuantity()); // 3 - 1
    }

    @Test
    void update_quantityDecrease_emitsSellTransaction() {
        PortfolioItem item = mkItem("BTC", "5", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));

        service.executeUpdateManualEntry(portfolio, makeReq("BTC", "2", "50000", null));

        ArgumentCaptor<Transaction> tx = ArgumentCaptor.forClass(Transaction.class);
        verify(txRepo).save(tx.capture());
        assertEquals(TradeSide.SELL, tx.getValue().getSide());
        assertEquals(new BigDecimal("3"), tx.getValue().getQuantity()); // 5 - 2
        assertTrue(tx.getValue().getNotes().contains("Quantity edit"));
    }

    @Test
    void update_quantitySame_noTransaction() {
        PortfolioItem item = mkItem("BTC", "5", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));

        service.executeUpdateManualEntry(portfolio, makeReq("BTC", "5", "55000", null));

        // Sadece average price güncellendi, qty değişmedi → tx kaydı yok
        verify(txRepo, never()).save(any());
        assertEquals(new BigDecimal("55000"), item.getAveragePrice());
    }

    @Test
    void update_oldQuantityZero_noEditNote() {
        PortfolioItem item = mkItem("BTC", "0", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));

        service.executeUpdateManualEntry(portfolio, makeReq("BTC", "5", "50000", null));

        ArgumentCaptor<Transaction> tx = ArgumentCaptor.forClass(Transaction.class);
        verify(txRepo).save(tx.capture());
        // oldQty=0 ise notes null
        assertNull(tx.getValue().getNotes());
    }

    // -------- executeRemoveFromPortfolio --------

    @Test
    void remove_itemMissing_throws404() {
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.empty());
        TradeRequestDto req = makeReq("BTC", null, null, null);
        assertThrows(ResourceNotFoundException.class,
                () -> service.executeRemoveFromPortfolio(portfolio, req));
    }

    @Test
    void remove_nullQuantity_deletesEntireItem() {
        PortfolioItem item = mkItem("BTC", "5", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));
        TradeRequestDto req = makeReq("BTC", null, "60000", null);

        service.executeRemoveFromPortfolio(portfolio, req);

        verify(itemRepo).delete(item);
        verify(itemRepo, never()).save(any());

        ArgumentCaptor<Transaction> tx = ArgumentCaptor.forClass(Transaction.class);
        verify(txRepo).save(tx.capture());
        assertEquals(TradeSide.SELL, tx.getValue().getSide());
        assertEquals(new BigDecimal("5"), tx.getValue().getQuantity());
        assertEquals(new BigDecimal("60000"), tx.getValue().getPrice());
    }

    @Test
    void remove_quantityFullOrMore_deletesItem() {
        PortfolioItem item = mkItem("BTC", "5", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));

        // qty = item qty → tam silme
        service.executeRemoveFromPortfolio(portfolio, makeReq("BTC", "5", "60000", null));
        verify(itemRepo).delete(item);
    }

    @Test
    void remove_partialQuantity_reducesItem() {
        PortfolioItem item = mkItem("BTC", "5", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));

        service.executeRemoveFromPortfolio(portfolio, makeReq("BTC", "2", "60000", null));

        assertEquals(new BigDecimal("3"), item.getQuantity());
        verify(itemRepo).save(item);
        verify(itemRepo, never()).delete(any());
    }

    @Test
    void remove_priceZero_fallsBackToAveragePrice() {
        PortfolioItem item = mkItem("BTC", "5", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));
        TradeRequestDto req = makeReq("BTC", "1", "0", null);

        service.executeRemoveFromPortfolio(portfolio, req);

        ArgumentCaptor<Transaction> tx = ArgumentCaptor.forClass(Transaction.class);
        verify(txRepo).save(tx.capture());
        // Sıfır fiyat → averagePrice fallback
        assertEquals(new BigDecimal("40000"), tx.getValue().getPrice());
    }

    @Test
    void remove_priceNull_fallsBackToAveragePrice() {
        PortfolioItem item = mkItem("BTC", "5", "40000");
        when(itemRepo.findByPortfolio_IdAndSymbol(any(), any())).thenReturn(Optional.of(item));
        TradeRequestDto req = makeReq("BTC", "1", null, null);

        service.executeRemoveFromPortfolio(portfolio, req);

        ArgumentCaptor<Transaction> tx = ArgumentCaptor.forClass(Transaction.class);
        verify(txRepo).save(tx.capture());
        assertEquals(new BigDecimal("40000"), tx.getValue().getPrice());
    }

    // -------- helpers --------

    private TradeRequestDto makeReq(String symbol, String qty, String price, String contractSize) {
        return new TradeRequestDto(
                symbol, AssetType.CRYPTO,
                qty != null ? new BigDecimal(qty) : null,
                price != null ? new BigDecimal(price) : null,
                contractSize != null ? new BigDecimal(contractSize) : null,
                null, null);
    }

    private PortfolioItem mkItem(String symbol, String qty, String avgPrice) {
        PortfolioItem item = new PortfolioItem();
        item.setId(UUID.randomUUID());
        item.setUser(user);
        item.setSymbol(symbol);
        item.setAssetType(AssetType.CRYPTO);
        item.setQuantity(new BigDecimal(qty));
        item.setAveragePrice(new BigDecimal(avgPrice));
        return item;
    }
}
