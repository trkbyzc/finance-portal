# syntax=docker/dockerfile:1.6
# Custom Keycloak — ban-authenticator SPI + finance-theme gömülü.
# Lokal docker-compose'da volume mount ile gelirdi; K8s'de pod restart'lara dayanıklı
# olması için image'a gömüldü. Build context: repo root (finance_portal/).
#
# Build:
#   docker build -f finance_portal/keycloak-image/Dockerfile \
#     -t europe-west1-docker.pkg.dev/finance-portal-demo/finance/keycloak:v1 \
#     finance_portal/
FROM quay.io/keycloak/keycloak:24.0.2

# ban-check-authenticator SPI — banlı kullanıcıyı browser flow'unda engeller.
COPY --chown=keycloak:0 keycloak-providers/ban-authenticator/target/ban-authenticator.jar \
     /opt/keycloak/providers/

# finance-theme — custom login/account UI (lokal'le tam parity).
COPY --chown=keycloak:0 keycloak-themes/ /opt/keycloak/themes/
