# Gözlemlenebilirlik (OpenTelemetry) — Metrics + Traces + Logs

Klasik **three pillars** kurulumu: tüm sinyaller tek bir **Grafana**'da birleşir ve
`trace_id` üzerinden birbirine bağlanır (correlation).

```
Spring Boot backend ──> OTel Java Agent (v2.4.0, -javaagent)
   (host, :8081)              │ OTLP gRPC :4317
        │ (direct scrape)     ▼
        │              otel-collector (contrib 0.96.0)
        │                 │ metrics :8889        │ traces
        ▼                 ▼                      ▼
   ┌──────────┐   (scrape)  ┌──────────┐   ┌──────────┐
   │Prometheus│◀────────────│          │   │  Tempo   │
   │ (v2.51)  │             └──────────┘   │ (2.4.1)  │
   └──────────┘                            └──────────┘
   Kafka │ finance-app-logs → Logstash → OpenSearch (2.11) ──┐
        ▼               ▼                       ▼
   ┌──────────────────────────────────────────────────┐
   │                 GRAFANA (10.4.0)                   │
   │   Prometheus + Tempo + OpenSearch datasource'ları  │
   └──────────────────────────────────────────────────┘
```

## Container'lar

`docker-compose.yml` içindeki gözlemlenebilirlik servisleri:

| Container             | Image                                            | Port            | Görev |
|-----------------------|--------------------------------------------------|-----------------|-------|
| grafana               | grafana/grafana:10.4.0                           | 3000            | Görselleştirme (admin/admin) |
| prometheus            | prom/prometheus:v2.51.0                          | 9090            | Metrik deposu (7g retention) |
| tempo                 | grafana/tempo:2.4.1                              | 3200            | Trace deposu (48h retention) |
| otel-collector        | otel/opentelemetry-collector-contrib:0.96.0      | 4317/4318/8889  | Trace+metrik toplayıcı/dağıtıcı |
| opensearch            | opensearchproject/opensearch:2.11.1              | 9200            | Log deposu |
| logstash              | logstash-oss-with-opensearch-output-plugin       | —               | Kafka → OpenSearch log aktarıcı |
| opensearch-dashboards | opensearchproject/opensearch-dashboards:2.11.1   | 5601            | Mevcut log dashboard'ları |

### Önemli teknoloji tercihleri
- **Metrikler iki yoldan** toplanır: (1) OTel Collector üzerinden (agent metrikleri,
  `:8889`), (2) `prometheus.yml`'de `finance-portal-backend` job'u backend'in
  `/actuator/prometheus` ucunu **doğrudan** scrape eder (Collector çökse bile JVM/HTTP
  liveness görünür).
- **Trace'ler** için kodda değişiklik minimum: **OTel Java Agent** bytecode-instrument
  eder. Ek olarak seçili fonksiyonlara `@WithSpan` eklenebilir
  (`opentelemetry-instrumentation-annotations` bağımlılığı pom'da mevcut).
- **Loglar** zaten Kafka → Logstash → OpenSearch hattından akıyor. Agent log4j2
  ThreadContext'e `trace_id`/`span_id` ekler; `finance-event-template.json` bunları
  mevcut dashboard'ların beklediği `mdc.traceId`/`mdc.spanId` alanlarına eşler.

## Kurulum / çalıştırma sırası

```powershell
# 1) OTel Java Agent'ı bir kez indir (otel-agent\opentelemetry-javaagent.jar)
.\scripts\download-otel-agent.ps1

# 2) Tüm altyapıyı kaldır (gözlemlenebilirlik dahil)
docker compose up -d

# 3) Backend'i agent ile başlat (run-dev OTEL_* env'lerini otomatik set eder)
.\run-dev.ps1
```

> Backend host'ta (`mvnw spring-boot:run`) çalışır, container'da değil. Agent OTLP'yi
> `localhost:4317`'e (yayınlanmış collector portu) gönderir; Prometheus host'taki
> backend'e `host.docker.internal:8081` ile ulaşır.

## Arayüzler

| Ne | URL | Not |
|----|-----|-----|
| Grafana | http://localhost:3000 | admin / admin · "Finance Portal" klasöründe overview dashboard |
| Prometheus | http://localhost:9090 | Status → Targets ile scrape sağlığı |
| Tempo (Grafana içinden) | Explore → Tempo | trace arama |
| OpenSearch Dashboards | http://localhost:5601 | mevcut log dashboard'ları |

## Doğrulama (smoke test)

1. `http://localhost:8081/actuator/prometheus` → metrik çıktısı geliyor mu
   (`http_server_requests_seconds_count` görünmeli).
2. Prometheus → Targets: `finance-portal-backend` ve `otel-collector` **UP**.
3. Birkaç API isteği at, sonra Grafana → "Finance Portal — Gözlemlenebilirlik":
   Request Volume / Response Time / Error Rate dolmalı.
4. Grafana → Explore → Tempo → Search: son trace'ler listelenmeli; bir trace aç,
   span'lerden loglara (OpenSearch) atlanabilmeli.

## Örnek dashboard panelleri
- **Service Health** — `up{job="finance-portal-backend"}`
- **Request Volume** — `rate(http_server_requests_seconds_count[5m])`
- **API Response Time** — p50/p95/p99 (`histogram_quantile` + `_bucket`)
- **Error Rate** — 5xx oranı
- **JVM Heap** — `jvm_memory_used_bytes`

## Alarmlar (Prometheus alert rules)

[observability/alert-rules.yml](../observability/alert-rules.yml) içinde 4 kural; Prometheus
`evaluation_interval` (15s) ile değerlendirir, koşul `for` süresince sürerse PENDING → FIRING olur.

| Alarm | Koşul | Önem |
|-------|-------|------|
| `BackendDown` | `up{job="finance-portal-backend"} == 0` (1dk) | critical |
| `HighErrorRate` | 5xx oranı > %5 (5dk) | critical |
| `SlowResponseP95` | p95 > 1s (5dk) | warning |
| `HighHeapUsage` | heap kullanımı > %85 (5dk) | warning |

Görünürlük:
- **Prometheus UI** → http://localhost:9090 → **Alerts** sekmesi (inactive/pending/firing).
- **Grafana** → "Finance Portal — Gözlemlenebilirlik" dashboard'unda **Aktif Alarm Sayısı** + **Aktif Alarmlar** panelleri (`ALERTS` metriği). 0 = sağlıklı.

> NOT: Şu an **Alertmanager YOK** — alarmlar değerlendirilir ve görünür olur ama
> Slack/e-posta'ya **gönderilmez**. Bildirim için Alertmanager container'ı + bir
> alıcı (Slack webhook / SMTP) eklemek ayrı bir adım.

Hızlı test: backend'i durdur → ~1dk sonra `BackendDown` FIRING olur (Prometheus Alerts
ve Grafana panelinde görünür); tekrar başlatınca inactive'e döner.

## Sorun giderme
- `/actuator/prometheus` 404 → `micrometer-registry-prometheus` bağımlılığı ve
  `management.endpoints.web.exposure.include` içinde `prometheus` olmalı (ikisi de eklendi).
- Prometheus target DOWN (backend) → Docker Desktop'ta `host.docker.internal` çözülüyor mu;
  backend gerçekten `:8081`'de mi.
- Grafana'da OpenSearch datasource hata → `grafana-opensearch-datasource` eklentisi
  internet erişimiyle kurulur (`GF_INSTALL_PLUGINS`); ilk açılışta biraz gecikebilir.
- Trace gelmiyor → `run-dev` "Java Agent aktif" yazdı mı; agent jar indirildi mi;
  collector `:4317` ayakta mı.
