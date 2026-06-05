# Performans

gereksinimler §9.1: *"Normal yük altında cevap süreleri makul olmalı (örn. <2 sn hedeflenebilir)."*

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

**PowerShell (Windows)** — `<` redirect desteklenmediği için volume mount kullan:
```powershell
docker run --rm --network host -v ${PWD}/scripts:/scripts grafana/k6 run /scripts/perf-test.js

# Farklı host'a karşı
docker run --rm --network host -e BASE_URL=http://staging:8080 -v ${PWD}/scripts:/scripts grafana/k6 run /scripts/perf-test.js
```

**Bash (Linux/macOS/Git Bash)** — stdin redirect veya volume mount:
```bash
# stdin
docker run --rm -i --network host grafana/k6 run - < scripts/perf-test.js
# veya volume
docker run --rm --network host -v "$PWD/scripts:/scripts" grafana/k6 run /scripts/perf-test.js
```

**k6 yüklüyse direkt** (her platformda):
```
k6 run scripts/perf-test.js
```

#### Beklenen Çıktı
```
✓ http_req_duration..............: p(95)=842ms  ✓
✓ http_req_failed................: 0.00%        ✓
```

## Son rapor

| Tarih | Ortam | P95 | Hata | Sonuç |
|---|---|---|---|---|
| _henüz çalıştırılmadı_ | local | — | — | — |

Test çalıştırıldıktan sonra sonuç bu tabloya işlenecek.
