package com.financeportal.news;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Haber servisi — Finance Portal'in ikinci calisan parcasi.
 *
 * <p><b>Ne yapar:</b> RSS kaynaklarindan haber baslikarini toplar, kategoriye ayirir,
 * icindeki varlik adlarini etiketler, Ingilizceye cevirir ve Redis'te tutar.
 * Arayuz haberleri buradan okur.
 *
 * <p><b>Neden ayri bir servis:</b> haberlerin veritabani tablosu YOK ve kodun geri
 * kalanina neredeyse hic baglanmiyordu — ayrildiginda mikroservisin pahali kismi
 * (veriyi bolmek, islem butunlugunu elde yeniden kurmak) hic devreye girmedi.
 * Portfoy tarafi ise tam tersi: 10 farkli alandan fiyat okuyor, bolunemez.
 *
 * <p><b>Neye baglidir:</b> Redis (onbellek) ve lingva (ceviri). Ikisi de zaten ayri
 * konteynerlerdi. Veritabani, Keycloak, Kafka ile hicbir isi yok.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class NewsApplication {
    public static void main(String[] args) {
        SpringApplication.run(NewsApplication.class, args);
    }
}
