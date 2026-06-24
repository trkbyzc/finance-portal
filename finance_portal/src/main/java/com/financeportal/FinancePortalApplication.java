package com.financeportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.Collections;

@SpringBootApplication
@EnableScheduling // Tüm @Scheduled görevleri için şart: sync servisler, settlement job'lar, alarm değerlendirme, ban expiry vb.
public class FinancePortalApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(FinancePortalApplication.class);

		// Profil belirtilmeden başlatıldığında 'dev' devreye girer; yoksa EVDS api-key eksik hatası alınır.
		app.setDefaultProperties(Collections.singletonMap("spring.profiles.default", "dev"));

		app.run(args);
	}
}