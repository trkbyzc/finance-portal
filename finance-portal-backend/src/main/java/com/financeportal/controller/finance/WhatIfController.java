package com.financeportal.controller.finance;

import com.financeportal.model.dto.whatif.WhatIfRequestDto;
import com.financeportal.model.dto.whatif.WhatIfResultDto;
import com.financeportal.service.portfolio.WhatIfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/what-if")
@RequiredArgsConstructor
@Tag(name = "What-If Karşılaştırma", description = "Aynı tarihte aynı tutarla farklı varlıkları karşılaştır — stateless, persist etmez.")
public class WhatIfController {

    private final WhatIfService whatIfService;

    @PostMapping("/compare")
    @Operation(
            summary = "Birden fazla varlık için what-if karşılaştırma",
            description = "Verilen tarih ve TL tutarıyla seçilen tüm varlıklar için P&L ve series'i paralel hesaplayıp döner. " +
                    "Sonuç hiç DB'ye yazılmaz."
    )
    public ResponseEntity<WhatIfResultDto> compare(@RequestBody WhatIfRequestDto request) {
        return ResponseEntity.ok(whatIfService.compare(request));
    }
}
