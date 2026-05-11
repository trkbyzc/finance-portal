package com.financeportal;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles; // 🚀 BU ŞART!

@SpringBootTest
@ActiveProfiles("dev") // 🚀 Testlerin 'dev' profilindeki (application-dev.yaml) ayarları okumasını sağlar
class FinancePortalApplicationTests {

	@Test
	void contextLoads() {
		// Uygulama context'i hatasız yüklenirse bu test geçer.
		// Artık @Value("${evds.api-key}") hata vermeyecek.
	}

}