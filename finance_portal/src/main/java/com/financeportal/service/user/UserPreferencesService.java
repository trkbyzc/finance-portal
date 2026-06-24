package com.financeportal.service.user;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.preferences.TickerSymbolDto;
import com.financeportal.model.dto.preferences.UserPreferencesDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.entity.UserTickerPref;
import com.financeportal.model.enums.TickerScope;
import com.financeportal.repository.UserRepository;
import com.financeportal.repository.UserTickerPrefRepository;
import com.financeportal.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Kullanıcı tercihleri (şimdilik sadece market ticker). GET tam state, PUT bulk replace pattern.
 *
 * Maksimum ticker sayısı 20 ile sınırlı — UI'da ticker bar'ı çok kalabalıklaştırmamak için.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferencesService {

    private static final int MAX_TICKERS = 20;

    private final UserTickerPrefRepository tickerPrefRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public UserPreferencesDto getMyPreferences() {
        UUID userId = securityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        List<TickerSymbolDto> tickers = tickerPrefRepository
                .findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .map(p -> new TickerSymbolDto(p.getSymbol(), p.getAssetType()))
                .toList();

        TickerScope scope = user.getTickerScope() != null ? user.getTickerScope() : TickerScope.HOME_ONLY;
        return new UserPreferencesDto(tickers, scope);
    }

    /**
     * Bulk replace — eski liste tamamen silinir, yeni liste insert edilir. Aynı transaction'da
     * scope da güncellenir. Tek atomik işlem.
     */
    @Transactional
    public UserPreferencesDto updateMyPreferences(UserPreferencesDto request) {
        UUID userId = securityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        List<TickerSymbolDto> incoming = request.getTickers() != null ? request.getTickers() : List.of();
        if (incoming.size() > MAX_TICKERS) {
            throw new IllegalArgumentException("En fazla " + MAX_TICKERS + " ticker eklenebilir.");
        }

        // Scope (null kalmasın — default ALL_PAGES)
        user.setTickerScope(request.getTickerScope() != null ? request.getTickerScope() : TickerScope.HOME_ONLY);
        userRepository.save(user);

        // Replace strategy — eski listeyi sil, yenisini yaz (display_order = index)
        tickerPrefRepository.deleteByUser_Id(userId);
        // flush'lamayı JPA'ya bırakıyoruz; insert sırasına aynı transaction içinde girer

        List<UserTickerPref> fresh = new ArrayList<>(incoming.size());
        for (int i = 0; i < incoming.size(); i++) {
            TickerSymbolDto t = incoming.get(i);
            if (t.getSymbol() == null || t.getAssetType() == null) continue;
            fresh.add(new UserTickerPref(UUID.randomUUID(), user, t.getSymbol(), t.getAssetType(), i));
        }
        tickerPrefRepository.saveAll(fresh);

        log.info("[PREFS] user={} ticker={} scope={}", userId, fresh.size(), user.getTickerScope());
        return getMyPreferences();
    }
}
