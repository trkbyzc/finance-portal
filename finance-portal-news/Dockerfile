# -----------------------------------------------------------------------------
# Haber servisi — cok asamali derleme
# -----------------------------------------------------------------------------
# Build:   docker build -t finance-portal-news ./finance-portal-news
#
# Backend'in Dockerfile'i ile ayni desen; farki cok daha kucuk olmasi:
# veritabani surucusu, Flyway, Kafka, Keycloak istemcisi yok.
# -----------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY .mvn/ .mvn/
COPY pom.xml ./
COPY --chmod=0755 mvnw ./

COPY src/ src/

# Testler CI'da ayri kosuyor; imaj derlemesinde atlanir.
RUN for i in 1 2 3; do \
        ./mvnw -B -DskipTests package && break \
        || (echo "Build denemesi $i basarisiz, tekrar deneniyor..." && sleep 5); \
    done && \
    mkdir -p /app && \
    mv target/*.jar /app/app.jar

# -----------------------------------------------------------------------------
# Calisma asamasi — ince JRE
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Root olarak calismasin.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/app.jar app.jar
USER app

EXPOSE 8082

# Konteyner ici saglik kontrolu icin wget gerekiyor (alpine'da busybox wget var).
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:8082/api/v1/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
