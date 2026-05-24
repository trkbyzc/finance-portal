package com.financeportal.domains.news.service;

import org.springframework.stereotype.Component;
import java.util.Locale;

@Component
public class NewsCategoryClassifier {

    public String assignCategory(String title, String desc) {
        if (title == null) title = "";
        if (desc == null) desc = "";

        String text = (title + " " + desc).toLowerCase(new Locale("tr", "TR"));

        if (text.contains("bitcoin") || text.contains("kripto") || text.contains("coin") || text.contains("ethereum")) return "Kripto";
        if (text.contains("borsa") || text.contains("hisse") || text.contains("bist")) return "Hisse Senetleri";
        if (text.contains("dolar") || text.contains("euro") || text.contains("faiz") || text.contains("tcmb")) return "Döviz Kurları";
        if (text.contains("altın") || text.contains("petrol") || text.contains("emtia")) return "Emtialar";
        if (text.contains("fon") || text.contains("tefas") || text.contains("portföy")) return "Yatırım Fonları";

        return "Genel Ekonomi";
    }
}