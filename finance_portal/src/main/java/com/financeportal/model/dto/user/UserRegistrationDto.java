package com.financeportal.model.dto;

import lombok.Data;
import java.util.Map;

@Data
public class UserRegistrationDto {
    private String email;
    private String username;
    // Anket cevapları: "yas_puan": 3, "tecrube_puan": 2 vb.
    private Map<String, Integer> surveyAnswers;
}