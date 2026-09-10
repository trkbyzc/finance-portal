package com.financeportal.domains.ipo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IpoDto {
    private String name;
    private String ticker;
    private String date;
    private String url;
    private String price;
    private String status;
}