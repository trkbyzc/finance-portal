package com.financeportal.keycloak;

import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Kullanıcı parolasını doğruladıktan sonra, 2FA (OTP) adımından ÖNCE çalışacak şekilde
 * tarayıcı akışına eklenir. Uygulamanın {@code users} tablosundaki
 * {@code ban_permanent} / {@code banned_until} alanlarına bakar; banlıysa akışı keser ve
 * temalı "askıya alındınız" hata sayfasını gösterir (kullanıcı OTP ekranını dahi görmez).
 *
 * Keycloak ve uygulama aynı PostgreSQL (finance_db) üzerinde çalıştığı için ban durumu,
 * Keycloak'ın JPA bağlantısı üzerinden native sorgu ile okunur (ek REST çağrısı yok).
 */
public class BanCheckAuthenticator implements Authenticator {

    private static final DateTimeFormatter UNTIL_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private record BanStatus(boolean permanent, LocalDateTime until) {}

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        UserModel user = context.getUser();
        if (user == null) {
            // Önceki adım kullanıcıyı set etmemişse karar veremeyiz; akışı diğer executor'lara bırak.
            context.attempted();
            return;
        }

        BanStatus ban = banStatus(context.getSession(), user.getId());
        if (ban != null) {
            // Kalıcı / geçici bana göre kullanıcıya ne kadar süreyle banlı olduğunu bildiren
            // parametreli mesajı seç (theme messages_*.properties içindeki {0}, {1} ile interpolate edilir).
            Response challenge;
            if (ban.permanent()) {
                challenge = context.form()
                        .setError("accountBannedPermanentMessage")
                        .createErrorPage(Response.Status.FORBIDDEN);
            } else {
                long daysLeft = Math.max(1,
                        (ChronoUnit.MINUTES.between(LocalDateTime.now(), ban.until()) + 1439) / 1440); // gün'e yukarı yuvarla
                challenge = context.form()
                        .setError("accountBannedUntilMessage", ban.until().format(UNTIL_FMT), daysLeft)
                        .createErrorPage(Response.Status.FORBIDDEN);
            }
            context.failure(AuthenticationFlowError.ACCESS_DENIED, challenge);
            return;
        }

        context.success();
    }

    private BanStatus banStatus(KeycloakSession session, String userId) {
        try {
            EntityManager em = session.getProvider(JpaConnectionProvider.class).getEntityManager();
            @SuppressWarnings("unchecked")
            List<Object[]> rows = em.createNativeQuery(
                            "SELECT ban_permanent, banned_until FROM users WHERE id = CAST(?1 AS uuid)")
                    .setParameter(1, userId)
                    .getResultList();

            if (rows.isEmpty()) return null; // app users tablosunda yoksa engelleme

            Object[] row = rows.get(0);
            boolean permanent = row[0] != null && (Boolean) row[0];
            if (permanent) return new BanStatus(true, null);

            if (row[1] == null) return null;
            LocalDateTime until = ((Timestamp) row[1]).toLocalDateTime();
            return LocalDateTime.now().isBefore(until) ? new BanStatus(false, until) : null;
        } catch (Exception e) {
            // DB okunamazsa fail-open: girişi bloklama (uygulama tarafındaki UserBanFilter yine yakalar).
            return null;
        }
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        // Etkileşim yok; tüm karar authenticate() içinde verilir.
    }

    @Override
    public boolean requiresUser() {
        return true;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return true;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    }

    @Override
    public void close() {
        // Paylaşımlı tek instance; kapatılacak kaynak yok.
    }
}
