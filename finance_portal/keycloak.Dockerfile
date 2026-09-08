# syntax=docker/dockerfile:1.6
#
# Finance Portal — canli ortam icin Keycloak imaji
#
#   docker build -f keycloak.Dockerfile -t finance-portal-keycloak:prod .
#   (build context = finance_portal/ ; docker-compose.prod.yml bunu kullanir)
#
# NEDEN AYRI BIR IMAJ?
# Yerel docker-compose.yml, temayi/SPI'i/realm'i host'tan volume ile baglar. Bu
# canlida calismaz: ban-authenticator'in JAR'i `target/` altinda uretilir ve
# `target/` git'e girmez. Sunucuda repo klonlandiginda o dosya yoktur, mount bos
# bir dizin olusturur ve Keycloak `ban-check-authenticator` saglayicisini
# bulamaz. Realm'in browserFlow'u ("browser-ban") bu saglayiciya bagli oldugu
# icin sonuc bozuk bir giris akisidir.
#
# Cozum: JAR'i imajin icinde derle. Imaj kendi kendine yeter, sunucuda derleme
# adimi ya da mount hizasi gerektirmez.

# -----------------------------------------------------------------------------
# Stage 1 — Ban authenticator SPI'ini derle
# -----------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS spi

WORKDIR /build

# Once pom — bagimliliklar katmanda cache'lensin
COPY keycloak-providers/ban-authenticator/pom.xml ./pom.xml
RUN mvn -B -q dependency:go-offline

COPY keycloak-providers/ban-authenticator/src ./src
# pom'da <finalName>ban-authenticator</finalName> tanimli → cikti sabit isimli.
RUN mvn -B -q package -DskipTests

# -----------------------------------------------------------------------------
# Stage 2 — Realm'i canli ortam icin donustur
# -----------------------------------------------------------------------------
# Ikinci bir realm dosyasi commit'lemek yerine dev realm'inden turetiyoruz: iki
# kopya kacinilmaz olarak birbirinden ayrisir — bu depoda realm aylarca olu GKE
# IP'leri tasidi ve kimse fark etmedi. Neyin neden cikarildigi realm-prod.jq'da.
#
# jq -e ile iki dogrulama: donusum sessizce bozulursa imaj derlenmesin.
FROM alpine:3 AS realm

RUN apk add --no-cache jq
WORKDIR /realm
COPY finance-realm.json realm-prod.jq ./
RUN jq -f realm-prod.jq finance-realm.json > finance-realm.prod.json \
    && jq -e '.users | length == 3' finance-realm.prod.json > /dev/null \
    && jq -e '.components["org.keycloak.storage.UserStorageProvider"] == null' finance-realm.prod.json > /dev/null

# -----------------------------------------------------------------------------
# Stage 3 — Keycloak: saglayici + temalari yerlestir ve yapilandirmayi derle
# -----------------------------------------------------------------------------
FROM quay.io/keycloak/keycloak:24.0.2 AS builder

# Build zamani secenekleri. Bunlar docker-compose.prod.yml'deki runtime environment
# blogunda da AYNI degerlerle TEKRARLANMALI. Keycloak acilista ikisini karsilastirir;
# runtime'da eksik olan secenegi varsayilanina donmus sayar, degisiklik gordugu icin
# imaji yeniden derler. O derleme yarida kalirsa sunucu tamamen bozulur.
# Gerekcenin uzun hali docker-compose.prod.yml'deki keycloak servisinde.
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true

COPY --from=spi /build/target/ban-authenticator.jar /opt/keycloak/providers/
COPY keycloak-themes/ /opt/keycloak/themes/

# Onceden derle: aksi halde Keycloak her acilista bunu kendisi yapar ve
# 2 cekirdekli ARM makinede acilisa dakikalar ekler.
RUN /opt/keycloak/bin/kc.sh build

# -----------------------------------------------------------------------------
# Stage 4 — calisma zamani
# -----------------------------------------------------------------------------
FROM quay.io/keycloak/keycloak:24.0.2

COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Realm ilk acilista iceri alinir (`start --import-realm`). Realm zaten VARSA
# Keycloak bu dosyayi yok sayar — yani burayi degistirmek CALISAN bir kurulumu
# guncellemez. Yeni realm'i yururluge sokmak icin mevcut realm'i silmek gerekir
# (admin REST API ile) ve ardindan konteyneri yeniden baslatmak.
COPY --from=realm /realm/finance-realm.prod.json /opt/keycloak/data/import/finance-realm.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
