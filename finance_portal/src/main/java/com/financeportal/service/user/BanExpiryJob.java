package com.financeportal.service.user;

import com.financeportal.model.entity.User;
import com.financeportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Süresi dolmuş geçici ban kayıtlarını her 10 dakikada bir temizler.
 * UserBanFilter zaten "şu an < bannedUntil" mantığıyla geçicileri otomatik düşürüyor,
 * ama DB tutarlılığı + analitik için bannedUntil'ı null'lamak temiz.
 * <p>
 * Kalıcı ban'lar dokunulmaz (banPermanent=true atlanır).
 * <p>
 * Devre dışı bırakmak için: <code>ban.expiry.enabled=false</code>.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "ban.expiry.enabled", matchIfMissing = true)
public class BanExpiryJob {

    private final UserRepository userRepository;

    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void liftExpiredBans() {
        LocalDateTime now = LocalDateTime.now();
        List<User> expired = userRepository.findByBannedUntilBeforeAndBanPermanentFalse(now);
        if (expired.isEmpty()) return;

        for (User u : expired) u.setBannedUntil(null);
        userRepository.saveAll(expired);

        log.info("[BAN-EXPIRY] {} kullanıcının süresi dolmuş geçici banı temizlendi.", expired.size());
    }
}
