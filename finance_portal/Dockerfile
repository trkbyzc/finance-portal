# syntax=docker/dockerfile:1.6
#
# Finance Portal Backend — Multi-stage Maven (Java 21) → Slim JRE 21 runtime.
#
# Build:   docker build -t finance-portal-backend ./finance_portal
# Run:     docker run --rm -p 8081:8081 \
#            -e DB_URL=jdbc:postgresql://postgres:5432/finance_db \
#            -e SPRING_PROFILES_ACTIVE=docker \
#            finance-portal-backend
#
# docker-compose.yml içindeki `app-backend` servisi tarafından kullanılır.

# -----------------------------------------------------------------------------
# Stage 1 — build (Maven + JDK 21)
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Maven wrapper + pom — bağımlılıkları önce indirilir (cache layer)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Kaynak kod
COPY src/ src/

# Build (testleri build aşamasında atla — CI ayrı çalıştırır)
# Maven Central kesintilerine karşı 3 retry: göç. tek seferde 58MB rocksdb indiremezse tekrar dene.
RUN for i in 1 2 3; do \
        ./mvnw -B -DskipTests package -Dmaven.wagon.http.retryHandler.count=5 && break \
        || (echo "Build attempt $i failed, retrying..." && sleep 5); \
    done && \
    mv target/finance_portal-*.jar /app/app.jar

# -----------------------------------------------------------------------------
# Stage 2 — runtime (slim JRE 21)
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Non-root user (container hardening)
RUN addgroup -S app && adduser -S -G app app

WORKDIR /app

# Build çıktısı + OpenTelemetry agent (mount edilecek, image'a gömülmedi)
COPY --from=build /app/app.jar /app/app.jar

# Port + healthcheck endpoint (springdoc + actuator default'u)
EXPOSE 8081

# Healthcheck — /actuator/health varsa daha iyi ama default /api/v1/news?lang=tr de iş görür
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:8081/api/v1/actuator/health || exit 1

USER app

# JVM ayarları + Spring profile container için
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0" \
    SPRING_PROFILES_ACTIVE=docker

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
