package com.financeportal.model.dto.portfolio;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Kullanıcının adlandırılmış portföyü (liste/switcher için). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioDto {
    private UUID id;
    private String name;
    private LocalDateTime createdAt;
    private int itemCount;
}
