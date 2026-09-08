package com.financeportal.controller.meta;

import com.financeportal.config.datasource.DataSourceProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.assertj.core.api.InstanceOfAssertFactories;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RuntimeInfoControllerTest {

    private DataSourceProperties properties;
    private RuntimeInfoController controller;

    @BeforeEach
    void setUp() {
        properties = new DataSourceProperties();
        controller = new RuntimeInfoController(properties);
    }

    private void put(String key, boolean enabled, boolean demoData) {
        DataSourceProperties.Policy p = new DataSourceProperties.Policy();
        p.setEnabled(enabled);
        p.setDemoData(demoData);
        properties.getPolicies().put(key, p);
    }

    @Test
    @DisplayName("Sentetik veri sunan kaynak yoksa demo modu kapalı — yerelde bant görünmez")
    void noDemoSourcesMeansDemoModeOff() {
        put("yahoo", true, false);
        put("fintables", true, false);

        Map<String, Object> body = controller.runtime();

        assertThat(body.get("demoMode")).isEqualTo(false);
        assertThat((List<?>) body.get("demoSources")).isEmpty();
    }

    @Test
    @DisplayName("Kapalı + demo-data açık kaynaklar listelenir ve demo modu açılır")
    void disabledWithDemoDataTurnsBannerOn() {
        put("yahoo", false, true);
        put("fintables", false, true);
        put("isyatirim", false, true);

        Map<String, Object> body = controller.runtime();

        assertThat(body.get("demoMode")).isEqualTo(true);
        assertThat(body.get("demoSources"))
                .asInstanceOf(InstanceOfAssertFactories.list(String.class))
                .containsExactly("fintables", "isyatirim", "yahoo");   // alfabetik
    }

    @Test
    @DisplayName("Sadece kapatılmış (demo verisi olmayan) kaynak demo moduna sayılmaz")
    void disabledWithoutDemoDataIsNotDemoSource() {
        put("news-content", false, false);   // bilgi kartı gösterilir, sentetik veri yok
        put("yahoo", false, true);

        Map<String, Object> body = controller.runtime();

        assertThat(body.get("demoMode")).isEqualTo(true);
        assertThat(body.get("demoSources"))
                .asInstanceOf(InstanceOfAssertFactories.list(String.class))
                .containsExactly("yahoo");
    }
}
