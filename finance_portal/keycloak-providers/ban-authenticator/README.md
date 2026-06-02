# Ban Check Authenticator (Keycloak SPI)

Askıya alınmış (banlı) kullanıcıyı **2FA / OTP adımından ÖNCE** engelleyen Keycloak özel
authenticator'ı. Parola doğrulandıktan hemen sonra çalışır; kullanıcı banlıysa akış kesilir ve
temalı "Hesabınız askıya alınmıştır" hata sayfası gösterilir — kullanıcı OTP ekranını dahi görmez.

Ban durumu uygulamanın `users` tablosundaki `ban_permanent` / `banned_until` alanlarından okunur.
Keycloak ile uygulama **aynı PostgreSQL (finance_db)** üzerinde olduğundan, kontrol Keycloak'ın
kendi JPA bağlantısı ile native SQL olarak yapılır (ek REST çağrısı yok).

> Not: Uygulama tarafındaki `UserBanFilter` (giriş sonrası 403) ve frontend `BanNoticeModal`
> hâlâ aktiftir — aktif oturum sırasında banlanan kullanıcıyı yakalar. Bu SPI ise girişin
> **2FA'dan önceki** noktasında engeller.

## 1. Derle

```bash
# finance_portal/ dizininden:
./mvnw -f keycloak-providers/ban-authenticator/pom.xml package
```

Çıktı: `keycloak-providers/ban-authenticator/target/ban-authenticator.jar`
(docker-compose bu dosyayı `/opt/keycloak/providers/` altına bağlar.)

## 2. Keycloak'ı yeniden başlat

```bash
docker compose up -d --force-recreate keycloak
```

`start-dev` modu, açılışta `/opt/keycloak/providers/` altındaki provider'ları otomatik build eder.
Loglarda `Ban Check (Finance Portal)` authenticator'ının yüklendiğini görürsün.

## 3. Tarayıcı akışına ekle (tek seferlik, admin konsolu)

`http://localhost:8080/admin` → ilgili realm → **Authentication** → **Flows**:

1. **Browser** akışını seç → sağ üstten **Duplicate** ("Browser - ban" gibi adlandır).
2. Kopyanın içinde **Forms** alt akışına gir.
3. **Username Password Form**'dan SONRA, **Browser - Conditional OTP**'den ÖNCE gelecek şekilde:
   **Add step** → **Ban Check (Finance Portal)** ekle.
4. Yeni adımın gereksinimini **Required** yap. Sıralamayı sürükleyerek
   `Username Password Form → Ban Check → Conditional OTP` olacak biçimde ayarla.
5. Akışı **Bind flow** → **Browser flow** olarak ata.

Artık banlı kullanıcı parolasını girer, ardından OTP yerine "askıya alındınız" sayfasını görür.

## 4. (Opsiyonel) "Ana sayfaya dön" linki

Hata sayfasındaki geri dönüş linkinin uygulamaya gitmesi için, realm'deki frontend client'ının
**Home URL / Base URL** alanını uygulama adresine (ör. `http://localhost:5173`) ayarla.

## Mesaj anahtarı

Hata metni temadan gelir: `keycloak-themes/finance-theme/login/messages/messages_{tr,en}.properties`
içindeki `accountBannedMessage`.
