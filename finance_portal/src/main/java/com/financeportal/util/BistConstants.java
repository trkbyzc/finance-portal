package com.financeportal.util;

import java.util.Set;

public class BistConstants {

    // BIST 30 Hisseleri
    public static final Set<String> BIST_30 = Set.of(
            "AKBNK", "ALARK", "ASELS", "ASTOR", "BIMAS", "BRSAN", "CVPAM", "DOAS",
            "EKGYO", "ENKAI", "EREGL", "FROTO", "GARAN", "GUBRF", "HEKTS", "ISCTR",
            "KCHOL", "KONTR", "KOZAA", "KOZAL", "KRDMD", "ODAS", "OYAKC", "PETKM",
            "PGSUS", "SAHOL", "SASA", "SISE", "TCELL", "THYAO", "TOASO", "TUPRS", "YKBNK"
    );

    // BIST 50'de olup BIST 30'da OLMAYANLAR (20 Hisse)
    public static final Set<String> BIST_50_EK_HISSELER = Set.of(
            "AGHOL", "AKFGY", "AKSA", "ALFAS", "AYDEM", "CANTE", "CIMSA", "CWENE",
            "DOHOL", "EGEEN", "ENJSA", "EUPWR", "GESAN", "GWIND", "HALKB", "ISMEN",
            "KMPUR", "MGROS", "QUAGR", "SMRTG", "SOKM", "TTKOM", "ULKER", "VAKBN", "ZOREN"
    );

    // BIST 100'de olup BIST 50'de OLMAYANLAR (50 Hisse)
    public static final Set<String> BIST_100_EK_HISSELER = Set.of(
            "ADESE", "AEFES", "AGROT", "ALGYO", "ANSGR", "ARCLK", "ARDYZ", "AYGAZ", "BERA", "BIOTK",
            "BRYAT", "CCOLA", "DOCO", "ECILC", "EGEPO", "FENER", "GENIL", "GSDHO", "IPEKE", "KAYSE",
            "KORDS", "MAVI", "OTKAR", "REEDR", "SDTTR", "TAVHL", "TKFEN", "TMSN", "TRGYO", "TSKB",
            "TURSG", "VESBE", "VESTL", "YEOTK", "TABGD", "KLSER", "SKBNK", "MIATK", "KCAER", "ZEDUR",
            "EUREN", "KZBGY", "DGNMO", "KLRHO", "AHGAZ", "SUWEN", "BOBET", "TUKAS", "ISGYO", "PSGYO"
    );
}