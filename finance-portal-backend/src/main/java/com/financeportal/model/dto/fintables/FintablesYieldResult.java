package com.financeportal.model.dto.fintables;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FintablesYieldResult {

    private String code;

    private String title;

    @JsonAlias({"yield_1m", "getiri1A", "yield1m"})
    private BigDecimal yield_1m;

    @JsonAlias({"price", "last_price", "lastPrice", "nav", "current_nav", "fiyat", "value"})
    private BigDecimal price;
}