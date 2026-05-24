<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=true; section>
    <#if section = "header">
    <#elseif section = "form">
        <p class="instruction-text">
            Ekstra güvenlik katmanı (2FA) ile portföyünüzü koruma altına alın.
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <#if totp.totpSecretQrCode??>
                <div style="background: white; padding: 12px; border-radius: 12px; display: inline-block; box-shadow: 0 0 30px rgba(0, 210, 255, 0.3);">
                    <img src="data:image/png;base64,${totp.totpSecretQrCode}" alt="QR Kod Okutunuz" style="display: block; width: 160px; height: 160px;">
                </div>
            <#else>
                <p style="color: #fca5a5;">(QR Kod Yüklenemedi, lütfen manuel kod kullanın.)</p>
            </#if>
        </div>

        <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 13px; text-align: center;">
            Kurulum anahtarı:
            <code style="color: var(--cyan); background: rgba(0,210,255,0.1); padding: 4px 8px; border-radius: 6px; font-family: monospace; letter-spacing: 1px;">${(totp.totpSecretEncoded)!""}</code>
        </p>

        <form action="${url.loginAction}" method="post">
            <input type="hidden" id="stateChecker" name="stateChecker" value="${stateChecker!''}">
            <input type="hidden" name="totpSecret" value="${(totp.totpSecret)!""}" />
            <#if mode??><input type="hidden" name="mode" value="${mode}" /></#if>

            <div class="input-group">
                <label for="totp" style="text-align:center;">6 Haneli Kodu Girin</label>
                <input type="text" id="totp" name="totp" autocomplete="off"
                       style="font-family: monospace; font-size: 26px; letter-spacing: 10px; text-align: center; font-weight: bold; color: var(--emerald);"
                       maxlength="6" autofocus />
            </div>

            <input type="hidden" id="userLabel" name="userLabel" value="FinancePortal-Terminal" />

            <div style="margin-top: 30px;">
                <button type="submit" class="btn-primary">Güvenliği Aktifleştir</button>
            </div>
        </form>
    </#if>
</@layout.registrationLayout>