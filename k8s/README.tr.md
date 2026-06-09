# Finance Portal — Kubernetes Manifestleri (GKE Autopilot)

[English](README.md) · **Türkçe**

GKE Autopilot cluster üzerine **17 servisin** tamamı.

## Klasör yapısı

```
k8s/
├── namespace/    namespace + resource quota
├── configs/      ConfigMap'ler (nginx, prometheus, tempo, otel, logstash, grafana)
├── secrets/      Secret'lar (DB password, JWT, API keys)
├── data/         PostgreSQL, Redis, OpenSearch (StatefulSet + PVC)
├── messaging/    Kafka, Zookeeper, Logstash
├── auth/         OpenLDAP, phpLDAPadmin, Keycloak
├── observability/ OTel Collector, Tempo, Prometheus, Grafana, OpenSearch Dashboards
├── app/          Lingva (translate), Backend, Frontend
├── network/      Ingress (frontend + backend + keycloak public)
└── scaling/      HPA (backend yatay ölçekleme)
```

## Uygulama sırası

Numaralandırma dosyaların önünde — alfabetik olarak `kubectl apply` çalışır:

```powershell
# Tek seferde tüm hiyerarşi:
kubectl apply -R -f k8s/

# VEYA aşama aşama (önerilen sıra):
kubectl apply -f k8s/namespace/
kubectl apply -f k8s/configs/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/data/         # → postgres + redis + opensearch (StatefulSet, ~2 dk)
kubectl apply -f k8s/messaging/    # → kafka + zookeeper + logstash
kubectl apply -f k8s/auth/         # → openldap, phpldapadmin, keycloak
kubectl apply -f k8s/observability/
kubectl apply -f k8s/app/          # → lingva, backend, frontend
kubectl apply -f k8s/network/      # → Ingress (public LB IP gelmesi 1-2 dk)
kubectl apply -f k8s/scaling/      # → HPA
```

## Public erişim

`network/70-ingress.yaml` Google Cloud HTTP(S) Load Balancer açar:

- `/` → frontend (nginx, React static)
- `/api/` → backend (Spring Boot)
- `/auth/` → Keycloak

Public IP almak için:
```powershell
kubectl get ingress -n finance -w
```

## Yük testi + HPA

```powershell
# HPA durumunu watch'la (1. terminal)
kubectl get hpa -n finance -w

# k6 load test (2. terminal, ingress IP'sini değiştir):
$BASE_URL = "http://<INGRESS_IP>"
docker run --rm -e BASE_URL=$BASE_URL -v ${PWD}/finance_portal/scripts:/scripts grafana/k6 run /scripts/perf-test.js
```

Backend replica'ları **1 → 5** otomatik scale olur (HPA CPU > %70 threshold).

## Cleanup

Cluster'ı kapatmadan tüm workload'ları temizlemek için:
```powershell
kubectl delete -R -f k8s/
```

Tamamen cluster silmek için:
```powershell
gcloud container clusters delete finance-portal-cluster --region=europe-west1
```
