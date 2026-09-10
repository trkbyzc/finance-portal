package com.financeportal.controller.meta;

import com.financeportal.config.datasource.DataSourceProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Arayüzün çalışma ortamı hakkında bilmesi gereken asgari bilgiyi sunar.
 *
 * <p>Tek kullanıcısı şimdilik demo uyarı bandı: canlı ortamda bazı sağlayıcılar
 * kapalı olduğu ve yerlerine üretilmiş veri sunulduğu için, kullanıcının bu veriyi
 * gerçek sanmaması gerekir. Bayrağı arayüzde sabitlemek yerine buradan okumak,
 * yapılandırma değiştiğinde arayüzün kendiliğinden doğru davranmasını sağlar.
 *
 * <p>Kimlik doğrulaması gerektirmez — ziyaretçi giriş yapmadan da bandı görmeli.
 */
@RestController
@RequestMapping("/meta")
@RequiredArgsConstructor
@Tag(name = "Meta", description = "Çalışma ortamı bilgisi")
public class RuntimeInfoController {

    private final DataSourceProperties dataSourceProperties;

    @GetMapping("/runtime")
    @Operation(summary = "Demo modu ve sentetik veri sunulan kaynaklar")
    public Map<String, Object> runtime() {
        // Sentetik veri sunulan kaynaklar: kapalı + demo-data açık olanlar.
        List<String> demoSources = dataSourceProperties.getPolicies().entrySet().stream()
                .filter(entry -> !entry.getValue().isEnabled() && entry.getValue().isDemoData())
                .map(entry -> entry.getKey())
                .sorted()
                .toList();

        return Map.of(
                "demoMode", !demoSources.isEmpty(),
                "demoSources", demoSources
        );
    }
}
