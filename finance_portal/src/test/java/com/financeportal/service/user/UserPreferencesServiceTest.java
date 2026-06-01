package com.financeportal.service.user;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.preferences.TickerSymbolDto;
import com.financeportal.model.dto.preferences.UserPreferencesDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.entity.UserTickerPref;
import com.financeportal.model.enums.AssetType;
import com.financeportal.model.enums.TickerScope;
import com.financeportal.repository.UserRepository;
import com.financeportal.repository.UserTickerPrefRepository;
import com.financeportal.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings({"unchecked", "rawtypes"})
class UserPreferencesServiceTest {

    @Mock
    private UserTickerPrefRepository tickerRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private UserPreferencesService service;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setTickerScope(TickerScope.HOME_ONLY);
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
    }

    // -------- getMyPreferences --------

    @Test
    void getMy_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getMyPreferences());
    }

    @Test
    void getMy_returnsTickersOrderedByDisplayOrder() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        UserTickerPref a = new UserTickerPref(UUID.randomUUID(), user, "BTC", AssetType.CRYPTO, 0);
        UserTickerPref b = new UserTickerPref(UUID.randomUUID(), user, "AKBNK", AssetType.STOCK, 1);
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of(a, b));

        UserPreferencesDto result = service.getMyPreferences();

        assertEquals(2, result.getTickers().size());
        assertEquals("BTC", result.getTickers().get(0).getSymbol());
        assertEquals("AKBNK", result.getTickers().get(1).getSymbol());
        assertEquals(TickerScope.HOME_ONLY, result.getTickerScope());
    }

    @Test
    void getMy_userScopeNull_defaultsToHomeOnly() {
        user.setTickerScope(null);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());

        UserPreferencesDto result = service.getMyPreferences();

        assertEquals(TickerScope.HOME_ONLY, result.getTickerScope());
    }

    @Test
    void getMy_emptyTickerList_returnsEmpty() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());

        UserPreferencesDto result = service.getMyPreferences();

        assertTrue(result.getTickers().isEmpty());
    }

    // -------- updateMyPreferences --------

    @Test
    void update_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        UserPreferencesDto req = new UserPreferencesDto(List.of(), TickerScope.HOME_ONLY);

        assertThrows(ResourceNotFoundException.class, () -> service.updateMyPreferences(req));
    }

    @Test
    void update_tooManyTickers_throwsIllegalArgument() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        // MAX_TICKERS = 20, 21 sembol gönderelim
        List<TickerSymbolDto> tooMany = IntStream.range(0, 21)
                .mapToObj(i -> new TickerSymbolDto("SYM" + i, AssetType.STOCK))
                .toList();
        UserPreferencesDto req = new UserPreferencesDto(tooMany, TickerScope.HOME_ONLY);

        assertThrows(IllegalArgumentException.class, () -> service.updateMyPreferences(req));
        // Sayı limiti aşıldı → delete/save çağrılmamalı
        verify(tickerRepo, never()).deleteByUser_Id(any());
        verify(tickerRepo, never()).saveAll(any());
    }

    @Test
    void update_maxTickersExactly_allowed() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());
        List<TickerSymbolDto> exactly20 = IntStream.range(0, 20)
                .mapToObj(i -> new TickerSymbolDto("SYM" + i, AssetType.STOCK))
                .toList();

        service.updateMyPreferences(new UserPreferencesDto(exactly20, TickerScope.HOME_ONLY));

        // Tam sınır geçer
        verify(tickerRepo).saveAll(any());
    }

    @Test
    void update_replacesOldList_deleteThenSaveAll() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());
        List<TickerSymbolDto> incoming = List.of(
                new TickerSymbolDto("BTC", AssetType.CRYPTO),
                new TickerSymbolDto("AKBNK", AssetType.STOCK)
        );

        service.updateMyPreferences(new UserPreferencesDto(incoming, TickerScope.HOME_ONLY));

        // Replace pattern: önce delete, sonra saveAll
        verify(tickerRepo).deleteByUser_Id(userId);
        ArgumentCaptor<List<UserTickerPref>> savedCap = ArgumentCaptor.forClass(List.class);
        verify(tickerRepo).saveAll(savedCap.capture());
        List<UserTickerPref> saved = savedCap.getValue();
        assertEquals(2, saved.size());
        assertEquals("BTC", saved.get(0).getSymbol());
        assertEquals(0, saved.get(0).getDisplayOrder());
        assertEquals("AKBNK", saved.get(1).getSymbol());
        assertEquals(1, saved.get(1).getDisplayOrder());
    }

    @Test
    void update_scopeNull_defaultsToHomeOnly() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());

        service.updateMyPreferences(new UserPreferencesDto(List.of(), null));

        // user.tickerScope set edildi
        verify(userRepo).save(user);
        assertEquals(TickerScope.HOME_ONLY, user.getTickerScope());
    }

    @Test
    void update_nullTickersList_treatedAsEmpty() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());

        service.updateMyPreferences(new UserPreferencesDto(null, TickerScope.HOME_ONLY));

        // Null listede de silinir + boş kayıt set edilir
        verify(tickerRepo).deleteByUser_Id(userId);
        ArgumentCaptor<List<UserTickerPref>> savedCap = ArgumentCaptor.forClass(List.class);
        verify(tickerRepo).saveAll(savedCap.capture());
        assertTrue(savedCap.getValue().isEmpty());
    }

    @Test
    void update_skipsTickerWithNullSymbolOrAssetType() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());
        List<TickerSymbolDto> mixed = new ArrayList<>();
        mixed.add(new TickerSymbolDto(null, AssetType.STOCK));    // null symbol
        mixed.add(new TickerSymbolDto("ETH", null));              // null type
        mixed.add(new TickerSymbolDto("BTC", AssetType.CRYPTO));  // valid

        service.updateMyPreferences(new UserPreferencesDto(mixed, TickerScope.HOME_ONLY));

        ArgumentCaptor<List<UserTickerPref>> savedCap = ArgumentCaptor.forClass(List.class);
        verify(tickerRepo).saveAll(savedCap.capture());
        // Sadece 'BTC' kayıdı geçer
        assertEquals(1, savedCap.getValue().size());
        assertEquals("BTC", savedCap.getValue().get(0).getSymbol());
    }

    @Test
    void update_persistsScopeOnUser() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(tickerRepo.findByUser_IdOrderByDisplayOrderAsc(userId)).thenReturn(List.of());

        service.updateMyPreferences(new UserPreferencesDto(List.of(), TickerScope.ALL_PAGES));

        verify(userRepo).save(user);
        assertEquals(TickerScope.ALL_PAGES, user.getTickerScope());
    }
}
