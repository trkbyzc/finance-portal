package com.financeportal.model.dto.fintables;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FintablesYieldResponse {
    private List<FintablesYieldResult> results;
}