<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=true; section>
    <#if section = "header">
        <h1 class="kc-form-title">${msg("totpSetupTitle")}</h1>
    <#elseif section = "form">
        <p class="kc-instruction">${msg("totpInstruction")}</p>

        <div class="kc-totp-qr-wrap">
            <#if totp.totpSecretQrCode??>
                <div class="kc-totp-qr">
                    <img src="data:image/png;base64,${totp.totpSecretQrCode}" alt="QR">
                </div>
            <#else>
                <p class="kc-alert kc-alert-warning">${msg("qrLoadError")}</p>
            </#if>
        </div>

        <p class="kc-totp-key">
            ${msg("totpSetupKey")}:
            <code>${(totp.totpSecretEncoded)!""}</code>
        </p>

        <form action="${url.loginAction}" method="post">
            <input type="hidden" id="stateChecker" name="stateChecker" value="${stateChecker!''}">
            <input type="hidden" name="totpSecret" value="${(totp.totpSecret)!""}" />
            <#if mode??><input type="hidden" name="mode" value="${mode}" /></#if>

            <div class="kc-form-group">
                <label for="totp" class="kc-label" style="text-align:center;">${msg("totpEnterCode")}</label>
                <input type="text" id="totp" name="totp" class="kc-input kc-otp-input"
                       autocomplete="off" maxlength="6" autofocus />
            </div>

            <input type="hidden" id="userLabel" name="userLabel" value="FinansPortal-Terminal" />

            <button type="submit" class="kc-btn-primary">${msg("doActivateSecurity")}</button>
        </form>
    </#if>
</@layout.registrationLayout>
