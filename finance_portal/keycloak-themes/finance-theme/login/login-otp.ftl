<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true; section>
    <#if section = "header">
    <#elseif section = "form">
        <p class="instruction-text" style="margin-bottom: 30px;">
            Lütfen Authenticator uygulamanızın ürettiği 6 haneli güvenlik kodunu girin.
        </p>

        <form id="kc-otp-login-form" action="${url.loginAction}" method="post">
            <div class="input-group">
                <label for="otp" style="text-align: center; color: var(--cyan);">Authenticator Kodu</label>
                <input id="otp" name="otp" autocomplete="off" type="text" autofocus
                       style="font-family: monospace; font-size: 28px; letter-spacing: 12px; text-align: center; color: var(--neon-blue); font-weight: 700;"
                       maxlength="6"/>
            </div>

            <div style="margin-top: 35px;">
                <input class="btn-primary" name="login" id="kc-login" type="submit" value="Bağlantıyı Onayla" />
            </div>
        </form>
    </#if>
</@layout.registrationLayout>