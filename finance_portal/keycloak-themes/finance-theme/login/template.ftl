<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>FINANSPORTAL | Tüm Piyasalar Tek Ekranda</title>

        <#if properties.styles?has_content>
            <#list properties.styles?split(' ') as style>
                <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
            </#list>
        </#if>
    </head>

    <body class="fintech-body">
    <!-- Arka plan animasyonları ve Grid -->
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-blue"></div>
    <div class="bg-glow bg-glow-emerald"></div>

    <div class="fintech-container">

        <!-- Ana Glassmorphism Kartı -->
        <div class="glass-card">

            <#-- Logo ve Slogan Alanı -->
            <div class="brand-header">
                <h1 class="brand-logo">FINANS<span class="text-blue">PORTAL</span></h1>
                <p class="brand-slogan">Tüm piyasalar tek ekranda.</p>
            </div>

            <#-- Uyarı Mesajları (Hata/Başarı) -->
            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="alert alert-${message.type}">
                    <span class="alert-icon"></span>
                    <span class="alert-text">${kcSanitize(message.summary)?no_esc}</span>
                </div>
            </#if>

            <#-- Sayfa İçeriği Form -->
            <div class="fintech-form-wrapper">
                <#nested "form">
            </div>

            <#-- Alt Bilgiler -->
            <#if displayInfo>
                <div class="fintech-info-wrapper">
                    <#nested "info">
                </div>
            </#if>

        </div>
    </div>
    </body>
    </html>
</#macro>