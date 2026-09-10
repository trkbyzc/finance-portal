# Finance Portal — Kubernetes Manifests (GKE Autopilot)

**English** · [Türkçe](README.tr.md)

All **17 services** on a GKE Autopilot cluster.

## Folder structure

```
k8s/
├── namespace/    namespace + resource quota
├── configs/      ConfigMaps (nginx, prometheus, tempo, otel, logstash, grafana)
├── secrets/      Secrets (DB password, JWT, API keys)
├── data/         PostgreSQL, Redis, OpenSearch (StatefulSet + PVC)
├── messaging/    Kafka, Zookeeper, Logstash
├── auth/         OpenLDAP, phpLDAPadmin, Keycloak
├── observability/ OTel Collector, Tempo, Prometheus, Grafana, OpenSearch Dashboards
├── app/          Lingva (translate), Backend, Frontend
├── network/      Ingress (frontend + backend + keycloak public)
└── scaling/      HPA (backend horizontal autoscaling)
```

## Apply order

The numbering on the folders means `kubectl apply` runs them alphabetically:

```powershell
# Everything at once:
kubectl apply -R -f k8s/

# OR stage by stage (recommended order):
kubectl apply -f k8s/namespace/
kubectl apply -f k8s/configs/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/data/         # → postgres + redis + opensearch (StatefulSet, ~2 min)
kubectl apply -f k8s/messaging/    # → kafka + zookeeper + logstash
kubectl apply -f k8s/auth/         # → openldap, phpldapadmin, keycloak
kubectl apply -f k8s/observability/
kubectl apply -f k8s/app/          # → lingva, backend, frontend
kubectl apply -f k8s/network/      # → Ingress (public LB IP takes 1-2 min)
kubectl apply -f k8s/scaling/      # → HPA
```

## Public access

`network/70-ingress.yaml` opens a Google Cloud HTTP(S) Load Balancer:

- `/` → frontend (nginx, React static)
- `/api/` → backend (Spring Boot)
- `/auth/` → Keycloak

Get the public IP:
```powershell
kubectl get ingress -n finance -w
```

## Load test + HPA

```powershell
# Watch the HPA (terminal 1)
kubectl get hpa -n finance -w

# k6 load test (terminal 2, replace the ingress IP):
$BASE_URL = "http://<INGRESS_IP>"
docker run --rm -e BASE_URL=$BASE_URL -v ${PWD}/finance-portal-backend/scripts:/scripts grafana/k6 run /scripts/perf-test.js
```

Backend replicas autoscale **1 → 5** (HPA CPU > 70% threshold).

## Cleanup

Remove all workloads without deleting the cluster:
```powershell
kubectl delete -R -f k8s/
```

Delete the cluster entirely:
```powershell
gcloud container clusters delete finance-portal-cluster --region=europe-west1
```
