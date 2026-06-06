# Finance Portal — Cloud cluster end-to-end recreate scripti.
#
# Sıralı işler:
#   1. GKE Autopilot cluster yarat (~5 dk)
#   2. NGINX Ingress Controller kur
#   3. cert-manager kur + Let's Encrypt ClusterIssuer apply
#   4. Tüm finance namespace manifest'leri apply
#   5. Public IP'leri al (Ingress + Keycloak LB)
#   6. nip.io hostname üret, Ingress'i patch et
#   7. Backend ConfigMap'i yeni Keycloak IP'siyle güncelle
#   8. Frontend image'ı yeni IP'lerle rebuild + push + apply
#   9. Pod'ların Ready olmasını bekle
#  10. Keycloak realm import komutlarını yazdır
#  11. Final URL'leri yazdır
#
# Kullanım:  .\scripts\open-cluster.ps1
# Toplam:    ~15-20 dakika

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'

# === KONFIG ===
$PROJECT       = 'finance-portal-demo'
$REGION        = 'europe-west1'
$CLUSTER       = 'finance-portal-cluster'
$NAMESPACE     = 'finance'
$REGISTRY      = "europe-west1-docker.pkg.dev/$PROJECT/finance"
$FE_TAG        = "demo-$(Get-Date -Format 'yyyyMMddHHmm')"
$REALM_JSON    = 'finance-realm-cloud-LATEST.json'

Write-Host "=== 1/11 Cluster yaratiliyor (~5 dk) ==="
gcloud container clusters create-auto $CLUSTER --region $REGION --project $PROJECT 2>&1 | Out-Host
gcloud container clusters get-credentials $CLUSTER --region $REGION --project $PROJECT 2>&1 | Out-Host

Write-Host "`n=== 2/11 NGINX Ingress Controller kuruluyor ==="
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
kubectl wait --for=condition=Available --timeout=180s `
    deployment/ingress-nginx-controller -n ingress-nginx

Write-Host "`n=== 3/11 cert-manager kuruluyor ==="
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml
kubectl wait --for=condition=Available --timeout=180s `
    deployment/cert-manager deployment/cert-manager-cainjector deployment/cert-manager-webhook `
    -n cert-manager
Start-Sleep -Seconds 10
kubectl apply -f k8s/network/72-letsencrypt-issuer.yaml

Write-Host "`n=== 4/11 Tum finance manifest'leri apply ==="
kubectl apply -R -f k8s/ 2>&1 | Where-Object { $_ -notmatch 'unchanged' }

Write-Host "`n=== 5/11 LB IP'leri bekleniyor (Ingress NGINX + Keycloak External) ==="
$NGINX_IP = $null; $KC_IP = $null
$timeout = 600  # 10 dk
$elapsed = 0
while ((-not $NGINX_IP -or -not $KC_IP) -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 15; $elapsed += 15
    $NGINX_IP = kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
    $KC_IP = kubectl get svc keycloak-external -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
    Write-Host "  $elapsed sn: NGINX=$NGINX_IP, Keycloak=$KC_IP"
}
if (-not $NGINX_IP -or -not $KC_IP) { throw "LB IP'leri 10 dakikada gelmedi" }

# nip.io hostname (NGINX IP icin)
$HOST_DOMAIN = ($NGINX_IP -replace '\.', '-') + '.nip.io'
Write-Host "  Public hostname: $HOST_DOMAIN"

Write-Host "`n=== 6/11 Ingress hostname patch (nip.io) ==="
$ingressYaml = Get-Content k8s/network/70-ingress.yaml -Raw
$ingressYaml = $ingressYaml -replace 'REPLACE_WITH_HOST\.nip\.io', $HOST_DOMAIN
$ingressYaml | Set-Content k8s/network/70-ingress.RUNTIME.yaml -Encoding UTF8
kubectl apply -f k8s/network/70-ingress.RUNTIME.yaml

Write-Host "`n=== 7/11 Backend ConfigMap Keycloak issuer guncelle ==="
kubectl patch configmap backend-config -n $NAMESPACE --type merge -p `
    "{`"data`":{`"KEYCLOAK_ISSUER_URI`":`"http://${KC_IP}/realms/finance-realm`"}}"
kubectl set env deployment/app-backend -n $NAMESPACE `
    SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI="http://${KC_IP}/realms/finance-realm" `
    SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI="http://keycloak:8080/realms/finance-realm/protocol/openid-connect/certs" `
    SPRING_KAFKA_BOOTSTRAP_SERVERS="kafka:9092"

Write-Host "`n=== 8/11 Frontend rebuild + push (yeni IP/host'larla) ==="
docker build `
    --build-arg VITE_API_BASE_URL=/api/v1 `
    --build-arg VITE_KEYCLOAK_URL="http://${KC_IP}" `
    --build-arg VITE_KEYCLOAK_REALM=finance-realm `
    --build-arg VITE_KEYCLOAK_CLIENT_ID=finance-client `
    --build-arg VITE_APP_URL="https://${HOST_DOMAIN}" `
    -t "${REGISTRY}/frontend:${FE_TAG}" `
    .\finance-frontend
docker push "${REGISTRY}/frontend:${FE_TAG}"
kubectl set image deployment/app-frontend -n $NAMESPACE frontend="${REGISTRY}/frontend:${FE_TAG}"

Write-Host "`n=== 9/11 Pod'lar Ready olana bekle ==="
kubectl rollout status deployment/app-frontend -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/app-backend -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/keycloak -n $NAMESPACE --timeout=180s

Write-Host "`n=== 10/11 Keycloak realm import (MANUEL — 2 dk) ==="
Write-Host "  Tarayicidan ac: http://${KC_IP}/admin/master/console/"
Write-Host "  Login: admin / admin"
Write-Host "  Create realm -> Browse -> $REALM_JSON -> Create"
Write-Host "  Sonra Clients > finance-client > Settings'te:"
Write-Host "    Valid redirect URIs: https://${HOST_DOMAIN}/*"
Write-Host "    Web origins: https://${HOST_DOMAIN}"
Read-Host "  Realm import + redirectUri update bitince Enter'a bas"

Write-Host "`n=== 11/11 TLS sertifika durumu ==="
Write-Host "  cert-manager Let's Encrypt'ten cert almak icin ~1-2 dk surer"
Write-Host "  Beklerken HTTP yine calisir, HTTPS hazir olunca tarayicida yesil kilit gorunur"
kubectl get certificate -n $NAMESPACE 2>&1 | Out-Host

Write-Host "`n========================================"
Write-Host "  SUNUM URL'LERI"
Write-Host "========================================"
Write-Host "  Frontend (HTTPS): https://${HOST_DOMAIN}"
Write-Host "  Frontend (HTTP fallback): http://${HOST_DOMAIN}"
Write-Host "  Keycloak admin: http://${KC_IP}/admin/master/console/"
Write-Host "  NGINX LB IP: ${NGINX_IP}"
Write-Host "  Keycloak LB IP: ${KC_IP}"
Write-Host "========================================"
