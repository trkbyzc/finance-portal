# Performans

Performans gereksinimi (SRS §9.1): *"Normal yük altında cevap süreleri makul olmalı (örn. <2 sn hedeflenebilir)."*

## Hedef
- **P95 latency < 2000 ms** (sanal kullanıcı = 20, 60 sn sürdürülen yük)
- **Hata oranı < %1**

## Ölçüm yöntemleri

### 1. Sürekli ölçüm — OpenTelemetry + Grafana
Backend, `opentelemetry-javaagent` ile her HTTP request'in süresini `http.server.duration` histogram metric'i olarak Prometheus'a yayınlar.

Grafana sorgusu (P95):
```promql
histogram_quantile(0.95, sum by (le, http_route) (rate(http_server_duration_milliseconds_bucket[5m])))
```

Bu metrik canlı dashboard'da görülebilir — dashboard `observability/grafana/dashboards/` altında provision edilir.

### 2. Sentetik yük testi — k6
[scripts/perf-test.js](../scripts/perf-test.js) en sık çağrılan 10 public read endpoint'i 20 sanal kullanıcıyla rastgele hit eder. Threshold ihlali olursa script `exit code 99` ile düşer (CI'da fail edilir).

#### Çalıştırma
Backend ayakta olmalı (port 8081 — script default'u). Farklı port için `BASE_URL` env'i geç.

**PowerShell (Windows + Docker Desktop WSL2)** — `--network host` flag'i Windows'ta host loopback'ine ulaşmıyor; `host.docker.internal` DNS adı kullanmak gerek:
```powershell
docker run --rm -e BASE_URL=http://host.docker.internal:8081 -v ${PWD}/scripts:/scripts grafana/k6 run /scripts/perf-test.js
```

**Bash (Linux/macOS/Git Bash)** — Linux'ta `--network host` çalışıyor; default `localhost:8081` direkt host'u işaret eder:
```bash
docker run --rm -i --network host grafana/k6 run - < scripts/perf-test.js
# veya volume
docker run --rm --network host -v "$PWD/scripts:/scripts" grafana/k6 run /scripts/perf-test.js
```

**k6 yüklüyse direkt** (her platformda):
```
k6 run scripts/perf-test.js
```

**Farklı host'a karşı** (staging vb.) — `BASE_URL` env'i geç:
```
docker run --rm -e BASE_URL=http://staging:8081 -v ${PWD}/scripts:/scripts grafana/k6 run /scripts/perf-test.js
```

#### Beklenen Çıktı
```
✓ http_req_duration..............: p(95)<2000ms
✓ http_req_failed................: 0.00%
checks_succeeded.................: 100.00%
```

## Son rapor

| Tarih | Ortam | P50 | P90 | **P95** | Max | Hata | Throughput | Sonuç |
|---|---|---|---|---|---|---|---|---|
| 2026-06-05 | local (Win11 + Docker Desktop) | 8.77ms | 798ms | **843ms** | 1.59s | 0.00% | 14 req/s, 1.8 MB/s | ✅ Geçti |

### Notlar
- Median 8.77ms — çoğu endpoint'i Redis cache'ten 10ms altı dönüyor.
- P95 ~843ms — `/api/market-data/all` endpoint'i cold-cache durumda 1-1.6s alıyor (7 paralel iç çağrı).
- Toplam 1396 istek tamamlandı, **sıfır hata**, 179 MB veri transfer.
- Threshold ihlali yok; SRS §9.1 hedefi (<2sn) marjla karşılanıyor.
