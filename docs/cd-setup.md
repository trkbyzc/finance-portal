# CD Setup — GitHub Actions → GKE

Bu doküman, GitHub Actions üzerinden GKE'ye otomatik deploy için tek seferlik kurulum adımlarını içerir. Setup'tan sonra `main` branch'e push veya manuel trigger ile `.github/workflows/deploy-to-gke.yml` otomatik çalışır.

## 1. GCP Service Account yaratımı

```powershell
# Değişkenler
$PROJECT = "finance-portal-demo"
$SA_NAME = "github-actions-deployer"
$SA_EMAIL = "$SA_NAME@$PROJECT.iam.gserviceaccount.com"

# Service Account yarat
gcloud iam service-accounts create $SA_NAME `
  --project=$PROJECT `
  --display-name="GitHub Actions CD"

# Gerekli roller (en az yetki prensibi)
gcloud projects add-iam-policy-binding $PROJECT `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/container.developer"            # GKE deployment

gcloud projects add-iam-policy-binding $PROJECT `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/artifactregistry.writer"        # Container image push

gcloud projects add-iam-policy-binding $PROJECT `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/iam.serviceAccountUser"         # Cluster auth

# JSON key dosyası oluştur (BUNU GIT'E COMMIT ETME)
gcloud iam service-accounts keys create gcp-sa-key.json `
  --iam-account=$SA_EMAIL `
  --project=$PROJECT
```

## 2. GitHub Secrets ekle

Repo → **Settings → Secrets and variables → Actions → New repository secret**

Aşağıdaki secret'ları ekle:

| Secret adı | Değer | Açıklama |
|---|---|---|
| `GCP_SA_KEY` | `gcp-sa-key.json` içeriği (tam JSON) | Service Account credentials |
| `GCP_PROJECT_ID` | `finance-portal-demo` | GCP project ID |
| `GCP_REGION` | `europe-west1` | GKE region |
| `GKE_CLUSTER_NAME` | `finance-portal-cluster` | GKE cluster adı |
| `VITE_KEYCLOAK_URL` | `http://<keycloak-lb-ip>` | Frontend build-arg (cluster ayağa kalktıktan sonra) |
| `VITE_APP_URL` | `https://<nip-host>` | Frontend build-arg |

## 3. JSON key'i sil + .gitignore

```powershell
# Lokalden sil
Remove-Item gcp-sa-key.json -Force

# .gitignore'a ekle (varsa atla)
"gcp-sa-key.json"     | Add-Content .gitignore
"*.gcp-key.json"      | Add-Content .gitignore
```

## 4. Workflow test

GitHub repo → **Actions → Deploy to GKE → Run workflow → main → Run**

Veya `main`'e küçük bir değişiklik push et — otomatik tetiklenir.

İlk run ~8-10 dk:
- Build backend image (~3 dk)
- Build frontend image (~2 dk)
- Push images (~1 dk)
- Apply manifests + rollout (~2 dk)

## 5. Cluster yoksa CD ne yapar?

Cluster silindiyse CD workflow `cluster credentials` adımında hata verir. Bu doğru davranış — önce `.\scripts\open-cluster.ps1` ile cluster ayakta olmalı. CD sadece yenilenen kod için image push + deployment update yapar.

## Sonuç akışı

```
main'e git push
   ↓
GitHub Actions tetiklenir
   ↓
SA JSON ile GCP auth
   ↓
gcloud + kubectl kurulur
   ↓
Backend + Frontend image build edilir
   ↓
Artifact Registry'e push
   ↓
kubectl set image (rolling update)
   ↓
Pod'lar yeni image ile gelir, eski pod'lar terminate olur (zero downtime)
   ↓
Smoke test
```

## Güvenlik notu

Service Account JSON key uzun ömürlü credential — kompromize olursa GCP'ye tam erişim sağlar. Production'da **Workload Identity Federation** (key'siz, OIDC token tabanlı) tercih edilir. Demo için SA key yeterlidir ama:

- Key'i sadece GitHub Secrets'ta tut, kodda asla
- Periyodik (90 gün) key rotate et
- Minimum role principle uygulanmış (yukarıdaki 3 role yeterli)
