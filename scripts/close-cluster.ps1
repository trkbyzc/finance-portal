# Finance Portal — Cloud cluster temizleme scripti.
#
# Sıralı işler:
#   1. Keycloak realm export (manuel admin UI değişiklikleri korunur)
#   2. GKE cluster sil (LB + PVC otomatik gider)
#   3. Orphan disk varsa temizle
#   4. Final özet
#
# Kullanım:  .\scripts\close-cluster.ps1
# Toplam:    ~5 dakika

$ErrorActionPreference = 'Stop'

# === KONFIG ===
$PROJECT     = 'finance-portal-demo'
$REGION      = 'europe-west1'
$CLUSTER     = 'finance-portal-cluster'
$NAMESPACE   = 'finance'

Write-Host "=== 1/4 Keycloak realm export (manuel degisiklikleri DAHIL) ==="
$kcPod = kubectl get pod -n $NAMESPACE -l app=keycloak -o jsonpath='{.items[0].metadata.name}' 2>$null
if ($kcPod) {
    Write-Host "  Pod: $kcPod"
    kubectl exec -n $NAMESPACE $kcPod -- /opt/keycloak/bin/kc.sh export `
        --dir /tmp/realm-export --realm finance-realm --users realm_file 2>&1 | Select-Object -Last 3
    kubectl exec -n $NAMESPACE $kcPod -- cat /tmp/realm-export/finance-realm-realm.json > finance-realm-cloud-LATEST.json
    Write-Host "  Export: finance-realm-cloud-LATEST.json ($(Get-Item finance-realm-cloud-LATEST.json | Select-Object -ExpandProperty Length) bytes)"
} else {
    Write-Host "  Keycloak pod bulunamadi — export atlandi (mevcut dosya korunur)"
}

Write-Host "`n=== 2/4 Cluster siliniyor (~3-5 dk) ==="
gcloud container clusters delete $CLUSTER --region $REGION --project $PROJECT --quiet 2>&1 | Select-Object -Last 3

Write-Host "`n=== 3/4 Orphan disk'ler temizleniyor ==="
$disks = gcloud compute disks list --filter="name~pvc-" --format="value(name,zone)" --project $PROJECT 2>$null
if ($disks) {
    $disks -split "`n" | ForEach-Object {
        if ($_ -match '^(\S+)\s+(\S+)$') {
            $name = $Matches[1]; $zone = ($Matches[2] -split '/')[-1]
            Write-Host "  Siliniyor: $name (zone $zone)"
            gcloud compute disks delete $name --zone $zone --project $PROJECT --quiet 2>&1 | Out-Null
        }
    }
}

Write-Host "`n=== 4/4 Final ozet ==="
$clusters = (gcloud container clusters list --format="value(name)" --project $PROJECT 2>$null | Measure-Object).Count
$disksCount = (gcloud compute disks list --format="value(name)" --project $PROJECT 2>$null | Measure-Object).Count
$rules = (gcloud compute forwarding-rules list --format="value(name)" --project $PROJECT 2>$null | Measure-Object).Count
Write-Host "  Clusters: $clusters"
Write-Host "  Persistent disks: $disksCount"
Write-Host "  Forwarding rules (LB): $rules"
Write-Host "  Artifact Registry images: KORUNDU (geri acista rebuild gereksiz)"
Write-Host ""
Write-Host "  Saatlik tasarruf: ~`$0.15"
Write-Host "  Geri acmak icin: .\scripts\open-cluster.ps1"
