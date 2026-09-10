package com.financeportal.config.datasource;

import com.financeportal.exception.DataSourceUnavailableException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DataSourcePolicyTest {

    private DataSourceProperties properties;
    private DataSourcePolicy policy;

    @BeforeEach
    void setUp() {
        properties = new DataSourceProperties();
        policy = new DataSourcePolicy(properties);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void put(String key, boolean enabled, boolean requiresAuth) {
        DataSourceProperties.Policy p = new DataSourceProperties.Policy();
        p.setEnabled(enabled);
        p.setRequiresAuth(requiresAuth);
        properties.getPolicies().put(key, p);
    }

    private void loginAs(String user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, "n/a", AuthorityUtils.NO_AUTHORITIES));
    }

    private void loginAnonymous() {
        SecurityContextHolder.getContext().setAuthentication(
                new AnonymousAuthenticationToken("key", "anonymousUser",
                        AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));
    }

    @Test
    @DisplayName("Tanımsız kaynak açık kabul edilir — yeni istemci yerelde kendiliğinden çalışır")
    void undefinedSourceIsOpen() {
        assertThat(policy.isEnabled("henuz-tanimlanmamis")).isTrue();
        assertThat(policy.isAvailable("henuz-tanimlanmamis")).isTrue();
        assertThatCode(() -> policy.check("henuz-tanimlanmamis")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("enabled=false → DISABLED gerekçesiyle istisna, dış çağrı hiç yapılmaz")
    void disabledSourceThrows() {
        put("yahoo", false, false);

        assertThat(policy.isAvailable("yahoo")).isFalse();
        assertThatThrownBy(() -> policy.check("yahoo"))
                .isInstanceOf(DataSourceUnavailableException.class)
                .satisfies(ex -> {
                    DataSourceUnavailableException e = (DataSourceUnavailableException) ex;
                    assertThat(e.getSource()).isEqualTo("yahoo");
                    assertThat(e.getReason()).isEqualTo(DataSourceUnavailableException.Reason.DISABLED);
                });
    }

    @Test
    @DisplayName("requires-auth=true + anonim istek → REQUIRES_AUTH")
    void authRequiredRejectsAnonymous() {
        put("fintables", true, true);
        loginAnonymous();

        assertThat(policy.isAvailable("fintables")).isFalse();
        assertThatThrownBy(() -> policy.check("fintables"))
                .isInstanceOf(DataSourceUnavailableException.class)
                .satisfies(ex -> assertThat(((DataSourceUnavailableException) ex).getReason())
                        .isEqualTo(DataSourceUnavailableException.Reason.REQUIRES_AUTH));
    }

    @Test
    @DisplayName("requires-auth=true + giriş yapmış kullanıcı → geçer")
    void authRequiredAllowsAuthenticated() {
        put("fintables", true, true);
        loginAs("trkbyzc");

        assertThat(policy.isAvailable("fintables")).isTrue();
        assertThatCode(() -> policy.check("fintables")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Kapalı kaynak, giriş yapılmış olsa da açılmaz")
    void disabledBeatsAuthentication() {
        put("isyatirim", false, true);
        loginAs("trkbyzc");

        assertThat(policy.isAvailable("isyatirim")).isFalse();
        assertThatThrownBy(() -> policy.check("isyatirim"))
                .isInstanceOf(DataSourceUnavailableException.class)
                .satisfies(ex -> assertThat(((DataSourceUnavailableException) ex).getReason())
                        .isEqualTo(DataSourceUnavailableException.Reason.DISABLED));
    }

    @Test
    @DisplayName("Yapılandırmadaki not istisnaya taşınır — arayüz gerekçeyi gösterebilsin")
    void noteIsCarriedToException() {
        DataSourceProperties.Policy p = new DataSourceProperties.Policy();
        p.setEnabled(false);
        p.setNote("Ücretli abonelik ürünü; canlı demoda sunulmuyor.");
        properties.getPolicies().put("fintables", p);

        assertThatThrownBy(() -> policy.check("fintables"))
                .satisfies(ex -> assertThat(((DataSourceUnavailableException) ex).getNote())
                        .isEqualTo("Ücretli abonelik ürünü; canlı demoda sunulmuyor."));
    }
}
