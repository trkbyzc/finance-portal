package com.financeportal.model.dto.news;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsDto {
    private String title;
    private String description;
    private String link;
    private String pubDate;
    private String source;
    private String imageUrl;
    private String category;
}