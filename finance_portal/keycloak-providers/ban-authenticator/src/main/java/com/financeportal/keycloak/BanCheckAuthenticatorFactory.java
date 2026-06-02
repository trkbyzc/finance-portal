package com.financeportal.keycloak;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.Collections;
import java.util.List;

/**
 * {@link BanCheckAuthenticator} için fabrika. Keycloak admin konsolunda tarayıcı akışına
 * "Ban Check (Finance Portal)" adıyla, Username-Password Form'dan SONRA ve OTP'den ÖNCE eklenir.
 */
public class BanCheckAuthenticatorFactory implements AuthenticatorFactory {

    public static final String PROVIDER_ID = "ban-check-authenticator";
    private static final BanCheckAuthenticator INSTANCE = new BanCheckAuthenticator();

    private static final Requirement[] REQUIREMENT_CHOICES = {
            Requirement.REQUIRED,
            Requirement.DISABLED
    };

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public Authenticator create(KeycloakSession session) {
        return INSTANCE;
    }

    @Override
    public String getDisplayType() {
        return "Ban Check (Finance Portal)";
    }

    @Override
    public String getReferenceCategory() {
        return "ban";
    }

    @Override
    public boolean isConfigurable() {
        return false;
    }

    @Override
    public Requirement[] getRequirementChoices() {
        return REQUIREMENT_CHOICES;
    }

    @Override
    public boolean isUserSetupAllowed() {
        return false;
    }

    @Override
    public String getHelpText() {
        return "Askıya alınmış (banlı) kullanıcıyı 2FA adımından önce engeller.";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return Collections.emptyList();
    }

    @Override
    public void init(Config.Scope config) {
        // Konfigürasyon yok.
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        // Başlangıç işlemi yok.
    }

    @Override
    public void close() {
        // Kapatılacak kaynak yok.
    }
}
