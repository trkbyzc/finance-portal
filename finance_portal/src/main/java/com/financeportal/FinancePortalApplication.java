package com.financeportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.Collections;

@SpringBootApplication
@EnableScheduling // 🚀 Mevduat faizlerini gece işleten @Scheduled görevleri için şart
public class FinancePortalApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(FinancePortalApplication.class);

		// 🚀 VİZYONER DOKUNUŞ:
		// Eğer uygulama başlatılırken hiçbir profil seçilmemişse varsayılan olarak 'dev' profilini aç.
		// Bu sayede hem testlerde hem de yerelde "evds.api-key bulunamadı" hatasından kurtulursun.
		app.setDefaultProperties(Collections.singletonMap("spring.profiles.default", "dev"));

		app.run(args);
	}
}