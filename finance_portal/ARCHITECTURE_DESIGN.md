# 🏛️ 32 Bit Finans Portalı - Mimari Kararlar ve Veri Kaynakları (ADR)

## 📌 Genel Bakış
Bu belge, 32 Bit Finans Portalı projesinde kullanılan dış veri kaynaklarını, entegrasyon yöntemlerini ve uygulama geliştirme sürecinde alınan kritik mühendislik kararlarının (Design Decisions) gerekçelerini içermektedir.

---

## 📊 1. Veri Kaynakları ve Entegrasyon Yöntemleri

### A. Piyasa Verileri (Market Data)
Sisteme akan finansal veriler, farklı varlık sınıflarına göre en güvenilir kaynaklardan, spesifik yöntemlerle çekilmektedir:

| Varlık Sınıfı | Veri Kaynağı | Entegrasyon Yöntemi & Mühendislik Kararı |
| :--- | :--- | :--- |
| **Temel Döviz Kurları** | **TCMB** | **XML Parsing:** Resmi XML API üzerinden 1 saatte bir çekilir. Sistemdeki "Single Source of Truth" (Tek Gerçek Kaynak) budur. |
| **Banka Kurları** | **Algoritmik (İç Sistem)** | **Simülasyon:** Web scraping IP ban riski taşıdığından ve yavaş olduğundan kullanılmamıştır. TCMB verisi üzerine `application.yaml`'dan okunan dinamik makas (spread) oranları algoritmik olarak eklenir. |
| **Kripto Paralar** | **CoinGecko API** | **REST API (`/simple/price`):** API key gerektirmeyen public endpoint kullanılmıştır. Gerçekçilik için %0.1 suni makas eklenir. 5 dakikada bir güncellenir. |
| **Hisse, Tahvil, Fon, VIOP, Emtia** | **Yahoo Finance** | **Ninja Pattern (v8 Chart API):** Yahoo'nun anti-bot WAF engellerini aşmak için User-Agent manipülasyonu yapılmış, veriler toplu değil tekil çekilmiş ve aralara `Thread.sleep` eklenerek insan davranışı simüle edilmiştir. |

### B. Haber Verileri (News Data)
Haber modülü, WAF (Web Application Firewall) engellerine takılmamak ve zengin içerik sunabilmek için "Hibrit Kaynak" ve "Web Kazıma (Scraping)" yöntemleriyle tasarlanmıştır:

| Haber Kategorisi | Veri Kaynağı | Entegrasyon Yöntemi & Mühendislik Kararı |
| :--- | :--- | :--- |
| **Genel Ekonomi** | **Bloomberg HT** | **Doğrudan RSS:** Sektörün en güvenilir ekonomi haberleri için bulut koruması olmayan Bloomberg RSS'i kullanılmıştır. |
| **Kripto** | **Uzmancoin** | **Doğrudan RSS:** Kripto dünyasının anlık verileri için bot engeli (WAF) bulunmayan yerel kaynak tercih edilmiştir. |
| **Hisse, Döviz, Emtia, Fon, VIOP, Tahvil**| **Google News** | **Parametrik RSS Arama:** Spesifik piyasa haberleri için `q=...&ceid=TR:tr` parametreleri ile Google'ın devasa haber ağı filtrelenerek kullanılmıştır. |
---

## ⚙️ 2. Sistem ve Altyapı Kararları

### 2.1. Dağıtık Önbellekleme (Redis Vision)
Dış API'ların (CoinGecko, Yahoo) rate-limit sınırlarına takılmamak ve sistem hızını milisaniyeler seviyesinde tutmak için Redis kullanılmıştır. Dış API çökse dahi sistem hata fırlatmaz, Redis'teki "En Son Başarılı Gerçek Veriyi" dönerek yüksek erişilebilirlik (High Availability) sağlar.

### 2.2. Dış API'lar İçin "Fallback (Yedek)" Mekanizması
Ücretsiz 3. parti API'ların anlık kesinti yaşama ihtimaline karşı kodda *Fallback Pattern* uygulanmıştır. Dış sistem çöküşü, portalın iç dinamiklerini etkilemez; sistem bellek içi (in-memory) yedek verilerle ayakta kalır.

### 2.3. Frontend Optimizasyonu İçin BFF (Backend for Frontend)
Giriş sayfasında (Dashboard) Frontend'in 8 farklı istek atıp ağı yormasını engellemek için `/api/market-data/all` endpoint'i yazılmıştır. Tüm piyasa verileri tek bir dev JSON paketiyle dönülerek render ve ağ performansı maksimize edilmiştir.

### 2.4. Repository Pattern ve Unit of Work (UoW)
Özellikle kullanıcının cüzdan/portföy işlemlerinde atomik veri bütünlüğünü sağlamak için işlemin "ya hep ya hiç" mantığıyla çalışması Unit of Work üzerinden garanti altına alınmıştır.

---

## 🛡️ 3. Güvenlik ve Kimlik Yönetimi Kararları

### 3.1. "Shadow User" Stratejisi (Yerel Senkronizasyon)
Kullanıcı kimlik doğrulaması (Auth) Keycloak üzerinden yapılsa da, JPA ilişkilerini (Portföy, İşlem Geçmişi) kurabilmek için `UserSyncFilter` ile Keycloak verileri yerel veritabanına otomatik kopyalanarak eşitlenir.

### 3.2. Kullanıcı Yasaklama (Ban) Mekanizması
Hatalı davranış sergileyen kullanıcılar, sistemin asıl servislerine ulaşmadan önce `UserBanFilter` (Interceptor) katmanında yakalanarak HTTP 403 ile geri çevrilir (Fail-Fast prensibi).

### 3.3. Public Data İzolasyonu
Finans portalı doğası gereği ziyaretçilere açıktır. `SecurityConfig` üzerinden piyasa ve analiz uçlarına `permitAll()` verilirken, portföy gibi yazma/gerçekleştirme işlemleri katı JWT izolasyonunda tutulmuştur.

### 3.4. Geliştirici Ortamı (Dev-Only) Proxy Tasarımı
Geliştiricilerin test sürecini hızlandırmak için sadece `@Profile("dev")` ortamında çalışan bir `AuthController` yazılmış, canlı ortamda (Prod) güvenlik zafiyeti yaratmadan test token'ları alınabilmesi sağlanmıştır.

---

## 📈 4. İş Mantığı ve Domain Kararları

### 4.1. Emtia (Commodity) Sınıflandırması
Altın, petrol gibi enstrümanlar VIOP altından çıkartılıp bağımsız bir yatırım sınıfı olarak `/commodities` altında toplanmış, böylece Bloomberg Terminal benzeri kurumsal bir yapı elde edilmiştir.

### 4.2. KYC Risk Profilleme Algoritması
Fintech regülasyonlarına uyum için, kullanıcıların sistemdeki anket verileri (yaş, tecrübe, kayıp toleransı) ağırlıklı bir puanlama algoritmasından geçirilerek (Conservative, Balanced, Aggressive) profillenmektedir.