package com.financeportal.model.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnabledResponseDto {
    private boolean enabled;

    public static EnabledResponseDto of(boolean enabled) {
        return new EnabledResponseDto(enabled);
    }
}
