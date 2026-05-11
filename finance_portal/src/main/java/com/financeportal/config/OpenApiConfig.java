package com.financeportal.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Finance Portal API", version = "v1", description = "Finance Portal Backend Endpoints (Developed by GitHub Copilot)"),
        security = @SecurityRequirement(name = "bearerAuth") // Bu sayede tum API'lere kilit isareti gelir
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Keycloak üzerinden aldiginiz Bearer Token'i buraya yapistirin."
)
public class OpenApiConfig {
}

