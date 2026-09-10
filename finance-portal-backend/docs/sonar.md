# SonarQube + JaCoCo — Kod Kalitesi & Test Coverage

Bu doküman, finance-portal-backend'de yerel SonarQube çalıştırmayı ve JaCoCo'dan
gelen test coverage'ı SonarQube'a göndermeyi anlatır.

## Genel resim

İki araç birbirini besliyor:

- **JaCoCo** → testlerin kodun yüzde kaçını çalıştırdığını ölçer (satır/branch coverage), `jacoco.xml` üretir.
- **SonarQube** → o `jacoco.xml`'i okur + kendi statik analizini (bug, code smell, güvenlik, duplikasyon) ekleyip tek panelde gösterir.

```
mvn verify  →  Surefire (unit) + Failsafe (IT)  →  JaCoCo agent kaydeder
                                                     ↓
                              target/site/jacoco/jacoco.xml  →  SonarQube (localhost:9000)
```

---

## 1) JaCoCo — Test Coverage

[pom.xml](../pom.xml) içinde `jacoco-maven-plugin` (v0.8.11) üç execution ile tanımlı:

- `prepare-agent` → unit test koşumunda JVM'e Java agent bağlar (satır coverage)
- `prepare-agent-integration` → integration test koşumunda agent bağlar
- `report` (`verify` fazında) → HTML + XML rapor üretir:
  - `target/site/jacoco/index.html` → tarayıcıda açıp insan okur
  - `target/site/jacoco/jacoco.xml` → SonarQube'un makine olarak okuduğu dosya

Test altyapısı:

- `mvn test` → sadece **Surefire** (unit testler, `*Test.java`, hızlı)
- `mvn verify` → Surefire + **Failsafe** (`*IT.java` integration testleri; Testcontainers Postgres + WireMock ile)

### Coverage raporunu yerelde üretme

```bash
./mvnw -B verify
# Sonra:
# Windows
start target/site/jacoco/index.html
# macOS/Linux
open target/site/jacoco/index.html
```

### CI tarafı

Her push/PR'da `mvn verify` koşulur ve JaCoCo raporu artifact olarak yüklenir
(`jacoco-coverage-report`, 14 gün saklanır). Yani coverage CI'da otomatik üretiliyor —
ama Sonar analizi CI'da koşmuyor (aşağıda).

---

## 2) SonarQube — Kod Kalitesi / Statik Analiz

**Self-hosted Community edition**, Docker ile çalışıyor.

> **Önemli nokta:** [docker-compose.yml](../docker-compose.yml) içinde `profiles: ["sonar"]`
> ile tanımlı. Yani normal `docker compose up` ile **başlamaz** — sadece istediğinde:

```bash
docker compose --profile sonar up -d sonarqube
# ~60-90 sn, ~2 GB RAM
# http://localhost:9000   (ilk giriş: admin/admin → şifre değiştir → token üret)
```

### Sonar ayarları kodda

[pom.xml](../pom.xml) properties bloğunda hazır — sadece URL ve token CLI'dan geçilir:

| Property | Değer / Anlamı |
|---|---|
| `sonar.projectKey` | `finance-portal-backend` |
| `sonar.java.source` | `21` |
| `sonar.coverage.jacoco.xmlReportPaths` | JaCoCo `jacoco.xml` yolu — **iki aracı bağlayan satır** |
| `sonar.junit.reportPaths` | surefire + failsafe raporları |
| `sonar.coverage.exclusions` | `dto/`, `entity/`, `enums/`, `config/`, `*Application.java` — coverage'a dahil edilmez |

### Analiz çalıştırma (backend dizininden)

```bash
./mvnw -B --no-transfer-progress verify sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<TOKEN>
```

Sonuçta `localhost:9000` panelinde proje şunları gösterir:
**Coverage** (JaCoCo'dan), **Bugs**, **Code Smells**, **Security Hotspots**, **Duplication**
ve **Quality Gate** (varsayılan `Sonar way`).

### Token üretme

1. `http://localhost:9000` → `admin / admin` ile gir, şifreyi değiştir
2. Sağ üstte profil > **My Account** > **Security**
3. **Generate Tokens** → `Name`: `local-dev`, `Type`: `User Token` → **Generate**
4. Çıkan token'ı kopyala (bir daha gösterilmez) — komut satırında `-Dsonar.token=<TOKEN>` olarak ver

---

## Dikkat edilecek 3 nokta

1. **SonarQube tamamen local/manuel.** PR'larda otomatik koşmuyor — bunun için ya public bir
   Sonar URL'i ya da SonarCloud gerekir (private repo'da ~50k LOC üstü ücretli).
2. **Veriler Docker volume'larında** (`sonarqube_data`, `sonarqube_extensions`, `sonarqube_logs`)
   tutulur, `down` etsen bile token ve geçmiş analizler korunur.
3. **JaCoCo `.exec` dosyaları `~/.jacoco/` altında yazılır** (proje target'ında değil).
   Sebep: proje klasörünün adında Türkçe `İ` karakteri varsa surefire
   fork JVM'i Windows'ta argLine'daki path'i cp1254 → Latin-1 mangle ediyor ve
   `.exec` yanlış klasöre (bozulmuş adla) yazılıyor. Çözüm pom.xml'de:
   `${jacoco.unit.exec}` → `${user.home}/.jacoco/finance-portal-unit.exec`.
   HTML/XML raporlar yine `target/site/jacoco/` altında, sadece intermediate
   `.exec` dosyası ASCII path'te.

---

## Hızlı referans

```bash
# Sadece coverage (rapor üret, Sonar'a gönderme)
./mvnw -B verify

# Sonar başlat + coverage göndererek tam analiz
docker compose --profile sonar up -d sonarqube
./mvnw -B verify sonar:sonar -Dsonar.token=<TOKEN>

# Sonar'ı kapat (data korunur)
docker compose --profile sonar down
```

---

## 3) Frontend (React) — ayrı Sonar projesi

Frontend JavaScript olduğu için JaCoCo işe yaramaz; **Vitest + @vitest/coverage-v8**
ile ölçülüyor (v8 coverage = Java tarafının JaCoCo'su). Çıktı `lcov.info` formatında.

Backend ile aynı SonarQube container'ı kullanılır, ama **ayrı projectKey**
(`finance-portal-frontend`) altında — Quality Gate ve coverage backend'den izole.

### Frontend Sonar analizi çalıştırma

```bash
# 1) SonarQube container'ı zaten ayakta olmalı (yukarıdaki docker compose komutu)
# 2) Frontend dizinine geç:
cd finance-portal-frontend

# 3) Coverage üret + Sonar'a gönder (tek komut):
npm run sonar
# Bu komut iki şey yapar: 'vitest run --coverage' → lcov.info üretir,
# sonra 'sonar-scanner' → finance-portal-frontend/sonar-project.properties'i okur ve gönderir.
```

### Sonar token nasıl geçilir

`sonarqube-scanner` token'ı şu sırayla arar:
1. CLI argümanı: `npx sonar-scanner -Dsonar.token=<TOKEN>`
2. Ortam değişkeni: `SONAR_TOKEN=<TOKEN>` (lokalde `.env` veya PowerShell'de `$env:SONAR_TOKEN`)
3. `sonar-project.properties` içindeki `sonar.token` (önerilmez, commit edilebilir)

Lokalde en kolay: backend ile aynı token, ortam değişkeni olarak:

```powershell
$env:SONAR_TOKEN = "squ_xxxxx"
npm run sonar
```

### Sonar config — `finance-portal-frontend/sonar-project.properties`

| Property | Değer |
|---|---|
| `sonar.projectKey` | `finance-portal-frontend` |
| `sonar.sources` | `src` |
| `sonar.tests` | `src` (test inclusion ile ayrılıyor) |
| `sonar.test.inclusions` | `**/*.test.js,**/*.test.jsx,**/*.spec.*` |
| `sonar.javascript.lcov.reportPaths` | `coverage/lcov.info` |
| `sonar.exclusions` | `node_modules`, `dist`, `coverage`, test dosyaları |
