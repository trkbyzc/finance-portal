<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true; section>
    <#if section = "header">
        <h1 class="kc-form-title">${msg("otpPageTitle")}</h1>
    <#elseif section = "form">
        <p class="kc-instruction">${msg("otpInstruction")}</p>

        <form id="kc-otp-login-form" action="${url.loginAction}" method="post">
            <div class="kc-form-group">
                <label for="otp" class="kc-label" style="text-align:center;">${msg("otpLabel")}</label>
                <input id="otp" name="otp" class="kc-input kc-otp-input"
                       autocomplete="off" type="text" autofocus maxlength="6" />
            </div>

            <button class="kc-btn-primary" name="login" id="kc-login" type="submit">${msg("doSubmitOtp")}</button>
        </form>
    </#if>
</@layout.registrationLayout>
