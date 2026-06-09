# Finans Portalı — Backend

[English](README.md) · **Türkçe**

Spring Boot (Java 21) **modüler-monolit** backend, **19 domain modülü** ile. REST API (`/api/v1`), piyasa verisi senkronu, portföy/alarm/sohbet mantığı ve entegrasyonları (Keycloak, Redis, Kafka, OpenSearch, dış piyasa & LLM sağlayıcıları) sunar.

> Tüm proje genel bakışı, mimari ve tek komutla başlatma için **[kök README](../README.tr.md)**'ye bak.

## Önkoşullar

- **JDK 21**
- **Docker** (bağımlılıklar için: PostgreSQL, Redis, Keycloak, Kafka, OpenSearch…)
- Maven **gerekli değil** — gömülü wrapper'ı kullan (`./mvnw`)

## Çalıştırma

### Seçenek A — Docker Compose ile tüm yığın (önerilen)

Bu dizinden, Compose dosyası backend'i derler ve tüm bağımlılıkları başlatır:

```bash
chmod +x mvnw   # yalnızca Linux/macOS, ilk seferde
./mvnw -f keycloak-providers/ban-authenticator/pom.xml package   # ban SPI derle (tek seferlik)
docker compose up -d
```

Backend: http://localhost:8081/api/v1 · Swagger: http://localhost:8081/api/v1/swagger-ui.html
*(Tam Hızlı Başlangıç, `.env` ve Keycloak realm import için kök README'ye bak.)*

### Seçenek B — Kaynaktan çalıştır (dev)

Sadece bağımlılıkları Docker ile başlat, sonra uygulamayı wrapper ile çalıştır:

```bash
# 1. Altyapıyı başlat (DB, cache, kimlik, mesajlaşma, arama...)
docker compose up -d postgres redis keycloak kafka zookeeper opensearch lingva

# 2. Backend'i çalıştır (varsayılan profiller: dev,local)
./mvnw spring-boot:run
```

Yerel çalıştırma için secret/API anahtarları `src/main/resources/application-local.yml` (gitignore'lu) veya ortam değişkenlerine girer.

## Profiller

| Profil | Amaç |
|--------|------|
| `dev`    | SQL loglama, tam actuator, DEBUG log |
| `local`  | Yerel API anahtarları (gitignore'lu) |
| `docker` | Container DNS / Keycloak JWK ayarları |
| `prod`   | Sertleştirme (WARN log, kısıtlı actuator) |
| `test`   | H2 bellek-içi DB, mock'lar |

Geçersiz kılma sırası: profil dosyası > `application.yaml` > kod varsayılanı.

## Yapılandırma (önemli env var'lar)

`DB_URL`, `DB_USERNAME`, `DB_PASSWORD` · `REDIS_HOST`, `REDIS_PORT` · `KAFKA_BOOTSTRAP_SERVERS` · `ELASTICSEARCH_URI` · `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_JWK_SET_URI`, `KEYCLOAK_SERVER_URL` · `EVDS_API_KEY`, `FRED_API_KEY`, `FMP_API_KEY`, `FINNHUB_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` · `MAIL_USERNAME`, `MAIL_PASSWORD`. (Tüm dış API anahtarları opsiyonel — eksik olanlar yalnızca kendi özelliğini kapatır.)

## Dokümantasyon, Testler & Kalite

```bash
./mvnw test         # birim testler (JUnit 5 + Mockito)
./mvnw verify       # birim + entegrasyon (*IT) + JaCoCo kapsam raporu
./mvnw javadoc:javadoc   # API dokümanı → target/site/apidocs/index.html
./mvnw -Psonar      # SonarQube analizi (önce SonarQube'u başlat: docker compose --profile sonar up -d sonarqube)
```

- API dokümantasyonu: **OpenAPI / Swagger UI** → `/api/v1/swagger-ui.html`
- Kapsam raporu: `target/site/jacoco/index.html`

## Yapı

```
src/main/java/com/financeportal/
├── controller/        # REST controller'lar (market, finance, user, alarm, chat)
├── domains/           # 19 domain modülü (controller/service/client/dto[/strategy])
├── service/           # domain-üstü servisler (auth, user, alarm, mail, messaging, market, chat/llm, chat/tools)
├── client/            # dış API/scraping adaptörleri (yahoo, binance, ...)
├── repository/        # Spring Data JPA repository'leri
├── model/             # entity / dto / enum
├── security/          # SecurityConfig + filtreler (ban, sync, session revocation)
├── config/            # Redis, Kafka, RestClient, Jackson, OpenAPI, LLM config
├── exception/         # GlobalExceptionHandler + ErrorResponse
└── util/
src/main/resources/db/migration/   # Flyway migration'ları (V1–V21)
keycloak-providers/ban-authenticator/   # Keycloak ban SPI
```

## Lisans

MIT — [kök LICENSE](../LICENSE).
