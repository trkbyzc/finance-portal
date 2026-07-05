# Finance Portal - Cloud cluster end-to-end recreate scripti.
#
# Kullanim:  .\scripts\open-cluster.ps1
# Toplam:    ~15-20 dakika

# PowerShell 5.1 native komutlarin stderr'ini NativeCommandError olarak isliyor.
# gcloud progress mesajlari stderr'e gider; bu yuzden Stop yerine Continue + LASTEXITCODE.
$ErrorActionPreference = "Continue"
$ProgressPreference    = "SilentlyContinue"

function Assert-Ok($Action) {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  HATA: $Action (exit code $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
}

# === KONFIG ===
$PROJECT       = "finance-portal-demo"
$REGION        = "europe-west1"
$CLUSTER       = "finance-portal-cluster"
$NAMESPACE     = "finance"
$REGISTRY      = "europe-west1-docker.pkg.dev/$PROJECT/finance"
$FE_TAG        = "demo-$(Get-Date -Format 'yyyyMMddHHmm')"
$REALM_JSON    = "finance-realm-cloud-LATEST.json"

Write-Host "=== 1/11 Cluster yaratiliyor (~5 dk) ==="
# Once mevcut cluster var mi kontrol et (idempotent restart icin)
$exists = gcloud container clusters list --filter="name=$CLUSTER" --format="value(name)" --project $PROJECT 2>$null
if ($exists -eq $CLUSTER) {
    Write-Host "  Cluster zaten var, atlandi"
} else {
    gcloud container clusters create-auto $CLUSTER --region $REGION --project $PROJECT
    if ($LASTEXITCODE -ne 0) { Write-Host "  HATA: cluster create (exit $LASTEXITCODE)" -ForegroundColor Red; exit 1 }
}
gcloud container clusters get-credentials $CLUSTER --region $REGION --project $PROJECT
Assert-Ok "get-credentials"

Write-Host "`n=== 2/11 NGINX Ingress Controller kuruluyor ==="
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
Assert-Ok "nginx-ingress apply"
kubectl wait --for=condition=Available --timeout=180s deployment/ingress-nginx-controller -n ingress-nginx
Assert-Ok "nginx-ingress wait"

Write-Host "`n=== 3/11 cert-manager kuruluyor ==="
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml
Assert-Ok "cert-manager apply"
kubectl wait --for=condition=Available --timeout=180s `
    deployment/cert-manager deployment/cert-manager-cainjector deployment/cert-manager-webhook `
    -n cert-manager
Assert-Ok "cert-manager wait"
# GKE Autopilot Warden kube-system'a lease yazmayi engelliyor. Iki fix gerek:
#   1. --leader-election-namespace=cert-manager arg (kendi namespace'ine yazsin)
#   2. cert-manager namespace'inde leases icin Role+RoleBinding (default install'da yok)
Write-Host "  cert-manager Autopilot fix: leader election args + RBAC..."
kubectl patch deployment cert-manager -n cert-manager --type='json' `
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--leader-election-namespace=cert-manager"}]' 2>&1 | Out-Null
kubectl patch deployment cert-manager-cainjector -n cert-manager --type='json' `
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--leader-election-namespace=cert-manager"}]' 2>&1 | Out-Null
kubectl apply -f k8s/network/71b-cert-manager-autopilot-rbac.yaml | Out-Null
kubectl rollout restart deployment/cert-manager deployment/cert-manager-cainjector -n cert-manager | Out-Null
kubectl rollout status deployment/cert-manager-cainjector -n cert-manager --timeout=120s | Out-Null
kubectl rollout status deployment/cert-manager -n cert-manager --timeout=120s | Out-Null
Write-Host "  cainjector caBundle inject ediyor (45 sn)..."
Start-Sleep -Seconds 45
# Webhook deployment Available olsa da, cainjector'in serving cert'i inject etmesi
# 30-60 sn alir. Retry loop ile basarili apply'i garanti et.
Write-Host "  cert-manager webhook TLS bootstrap bekleniyor (60-120 sn)..."
$issuerOk = $false
for ($i = 1; $i -le 12; $i++) {
    Start-Sleep -Seconds 10
    kubectl apply -f k8s/network/72-letsencrypt-issuer.yaml 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $issuerOk = $true
        Write-Host "  ClusterIssuer apply OK (deneme $i)"
        break
    }
    Write-Host "  deneme $i/12 - webhook henuz hazir degil, 10 sn sonra tekrar"
}
if (-not $issuerOk) {
    Write-Host "  HATA: ClusterIssuer apply 2 dk icinde basaramadi" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 4/11 Namespace + manifest'leri apply ==="
# Once namespace'i ayri yarat — race condition (manifest'ler namespace yokken
# yaratilamiyor). Sonra 5 sn bekle ki API server cache'lesin.
kubectl apply -f k8s/namespace/
Assert-Ok "namespace apply"
Start-Sleep -Seconds 5
# 70-ingress.yaml placeholder host icerir, 6/11'de patch'lenip apply olacak.
# Gecici olarak .SKIP suffix ile hariç tut.
$ingressOrig = "k8s/network/70-ingress.yaml"
$ingressSkip = "k8s/network/70-ingress.SKIP"
if (Test-Path $ingressOrig) { Move-Item $ingressOrig $ingressSkip -Force }
try {
    kubectl apply -R -f k8s/
    if ($LASTEXITCODE -ne 0) {
        # Ilk apply'da race olabilir, 5 sn bekle + tekrar
        Start-Sleep -Seconds 5
        kubectl apply -R -f k8s/
        Assert-Ok "manifests apply (retry)"
    }
} finally {
    if (Test-Path $ingressSkip) { Move-Item $ingressSkip $ingressOrig -Force }
}

Write-Host "`n=== 5/11 LB IP leri bekleniyor (Ingress NGINX + Keycloak External) ==="
$NGINX_IP = $null; $KC_IP = $null
$timeout = 600
$elapsed = 0
while ((-not $NGINX_IP -or -not $KC_IP) -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 15; $elapsed += 15
    $NGINX_IP = kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath="{.status.loadBalancer.ingress[0].ip}" 2>$null
    $KC_IP = kubectl get svc keycloak-external -n $NAMESPACE -o jsonpath="{.status.loadBalancer.ingress[0].ip}" 2>$null
    Write-Host "  $elapsed sn: NGINX=$NGINX_IP, Keycloak=$KC_IP"
}
if (-not $NGINX_IP -or -not $KC_IP) {
    Write-Host "  HATA: LB IP leri 10 dakikada gelmedi" -ForegroundColor Red
    exit 1
}

$HOST_DOMAIN = ($NGINX_IP -replace "\.", "-") + ".nip.io"
Write-Host "  Public hostname: $HOST_DOMAIN"

Write-Host "`n=== 6/11 Ingress hostname patch (nip.io) ==="
$ingressYaml = Get-Content k8s/network/70-ingress.yaml -Raw
$ingressYaml = $ingressYaml -replace "REPLACE_WITH_HOST\.nip\.io", $HOST_DOMAIN
$ingressYaml | Set-Content k8s/network/70-ingress.RUNTIME.yaml -Encoding UTF8
kubectl apply -f k8s/network/70-ingress.RUNTIME.yaml
Assert-Ok "ingress patched apply"

Write-Host "`n=== 7/11 Backend ConfigMap Keycloak issuer guncelle ==="
$KC_HTTPS_URL = "https://kc.${HOST_DOMAIN}"
# JSON string ile doğrudan inşa et — ConvertTo-Json nested hashtable encoding sorunu yok
$cmPatch = '{"data":{"KEYCLOAK_ISSUER_URI":"' + $KC_HTTPS_URL + '/realms/finance-realm"}}'
kubectl patch configmap backend-config -n $NAMESPACE --type merge -p $cmPatch
if ($LASTEXITCODE -ne 0) { Write-Host "  ConfigMap patch başarısız, set env ile devam..." -ForegroundColor Yellow }
kubectl set env deployment/app-backend -n $NAMESPACE `
    SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI="${KC_HTTPS_URL}/realms/finance-realm" `
    SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI="http://keycloak:8080/realms/finance-realm/protocol/openid-connect/certs" `
    SPRING_KAFKA_BOOTSTRAP_SERVERS="kafka:9092" `
    SECURITY_CORS_ALLOWED_ORIGINS="https://*.nip.io,http://localhost:5173,http://localhost:*"
Assert-Ok "backend env set"

Write-Host "`n=== 8/11 Frontend rebuild + push (yeni IP/host larla) ==="
docker build `
    --build-arg VITE_API_BASE_URL=/api/v1 `
    --build-arg VITE_KEYCLOAK_URL="https://kc.${HOST_DOMAIN}" `
    --build-arg VITE_KEYCLOAK_REALM=finance-realm `
    --build-arg VITE_KEYCLOAK_CLIENT_ID=finance-client `
    --build-arg VITE_APP_URL="https://${HOST_DOMAIN}" `
    -t "${REGISTRY}/frontend:${FE_TAG}" `
    .\finance-frontend
Assert-Ok "docker build"
docker push "${REGISTRY}/frontend:${FE_TAG}"
Assert-Ok "docker push"
kubectl set image deployment/app-frontend -n $NAMESPACE frontend="${REGISTRY}/frontend:${FE_TAG}"
Assert-Ok "frontend set image"

Write-Host "`n=== 9/11 Pod lar Ready olana bekle ==="
kubectl rollout status deployment/app-frontend -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/app-backend -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/keycloak -n $NAMESPACE --timeout=180s

Write-Host "`n=== 10/11 Keycloak realm import (MANUEL - 2 dk) ==="
Write-Host "  Tarayicidan ac: http://${KC_IP}/admin/master/console/"
Write-Host "  Login: admin / admin"
Write-Host "  Create realm -> Browse -> $REALM_JSON -> Create"
Write-Host "  Sonra Clients > finance-client > Settings sekmesinde:"
Write-Host "    Valid redirect URIs: https://${HOST_DOMAIN}/*"
Write-Host "    Web origins: https://${HOST_DOMAIN}"
Read-Host "  Realm import + redirectUri update bitince Enter a bas"

Write-Host "`n=== 11/11 TLS sertifika durumu ==="
Write-Host "  cert-manager Let's Encrypt ten cert almak icin ~1-2 dk surer"
Write-Host "  Beklerken HTTP yine calisir, HTTPS hazir olunca tarayicida yesil kilit gorunur"
kubectl get certificate -n $NAMESPACE

Write-Host "`n========================================"
Write-Host "  SUNUM URL LERI"
Write-Host "========================================"
Write-Host "  Frontend (HTTPS): https://${HOST_DOMAIN}"
Write-Host "  Frontend (HTTP fallback): http://${HOST_DOMAIN}"
Write-Host "  Keycloak admin: http://${KC_IP}/admin/master/console/"
Write-Host "  NGINX LB IP: ${NGINX_IP}"
Write-Host "  Keycloak LB IP: ${KC_IP}"
Write-Host "========================================"
