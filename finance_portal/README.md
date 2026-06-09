# Finance Portal — Backend

**English** · [Türkçe](README.tr.md)

Spring Boot (Java 21) **modular-monolith** backend with **19 domain modules**. Provides the REST API (`/api/v1`), market-data sync, portfolio/alarms/chat logic, and integrations (Keycloak, Redis, Kafka, OpenSearch, external market data & LLM providers).

> For the full project overview, architecture, and one-command stack startup, see the **[root README](../README.md)**.

## Prerequisites

- **JDK 21**
- **Docker** (for the dependencies: PostgreSQL, Redis, Keycloak, Kafka, OpenSearch…)
- Maven is **not** required — use the included wrapper (`./mvnw`)

## Run

### Option A — Full stack via Docker Compose (recommended)

From this directory, the Compose file builds the backend and starts every dependency:

```bash
chmod +x mvnw   # Linux/macOS only, first time
./mvnw -f keycloak-providers/ban-authenticator/pom.xml package   # build ban SPI (once)
docker compose up -d
```

Backend: http://localhost:8081/api/v1 · Swagger: http://localhost:8081/api/v1/swagger-ui.html
*(See the root README for the full Quick Start, `.env`, and Keycloak realm import.)*

### Option B — Run the app from source (dev)

Start only the dependencies via Docker, then run the app with the wrapper:

```bash
# 1. Start infrastructure (DB, cache, identity, messaging, search...)
docker compose up -d postgres redis keycloak kafka zookeeper opensearch lingva

# 2. Run the backend (default profiles: dev,local)
./mvnw spring-boot:run
```

Secrets / API keys for local runs go into `src/main/resources/application-local.yml` (gitignored) or environment variables.

## Profiles

| Profile | Purpose |
|---------|---------|
| `dev`    | SQL logging, full actuator, DEBUG logs |
| `local`  | Local API keys (gitignored) |
| `docker` | Container DNS / Keycloak JWK settings |
| `prod`   | Hardening (WARN logs, restricted actuator) |
| `test`   | H2 in-memory DB, mocks |

Override order: profile file > `application.yaml` > code default.

## Configuration (key env vars)

`DB_URL`, `DB_USERNAME`, `DB_PASSWORD` · `REDIS_HOST`, `REDIS_PORT` · `KAFKA_BOOTSTRAP_SERVERS` · `ELASTICSEARCH_URI` · `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_JWK_SET_URI`, `KEYCLOAK_SERVER_URL` · `EVDS_API_KEY`, `FRED_API_KEY`, `FMP_API_KEY`, `FINNHUB_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` · `MAIL_USERNAME`, `MAIL_PASSWORD`. (All external API keys are optional — missing ones only disable their feature.)

## Documentation, Tests & Quality

```bash
./mvnw test         # unit tests (JUnit 5 + Mockito)
./mvnw verify       # unit + integration (*IT) + JaCoCo coverage report
./mvnw javadoc:javadoc   # API docs → target/site/apidocs/index.html
./mvnw -Psonar      # SonarQube analysis (start SonarQube first: docker compose --profile sonar up -d sonarqube)
```

- API documentation: **OpenAPI / Swagger UI** at `/api/v1/swagger-ui.html`
- Coverage report: `target/site/jacoco/index.html`

## Structure

```
src/main/java/com/financeportal/
├── controller/        # REST controllers (market, finance, user, alarm, chat)
├── domains/           # 19 domain modules (controller/service/client/dto[/strategy])
├── service/           # cross-domain services (auth, user, alarm, mail, messaging, market, chat/llm, chat/tools)
├── client/            # external API/scraping adapters (yahoo, binance, ...)
├── repository/        # Spring Data JPA repositories
├── model/             # entity / dto / enums
├── security/          # SecurityConfig + filters (ban, sync, session revocation)
├── config/            # Redis, Kafka, RestClient, Jackson, OpenAPI, LLM config
├── exception/         # GlobalExceptionHandler + ErrorResponse
└── util/
src/main/resources/db/migration/   # Flyway migrations (V1–V21)
keycloak-providers/ban-authenticator/   # Keycloak ban SPI
```

## License

MIT — see the [root LICENSE](../LICENSE).
