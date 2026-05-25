<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        <h1 class="kc-form-title">${msg("doLogIn")}</h1>
        <p class="kc-form-subtitle">${msg("loginPageSubtitle")}</p>
    <#elseif section = "form">
        <form id="kc-form-login" action="${url.loginAction}" method="post">

            <div class="kc-form-group">
                <label for="username" class="kc-label">${msg("usernameOrEmail")}</label>
                <input tabindex="1" id="username" name="username" class="kc-input"
                       value="${(login.username!'')}" type="text"
                       autofocus autocomplete="off"
                       placeholder="${msg('placeholderUsername')}"/>
            </div>

            <div class="kc-form-group">
                <label for="password" class="kc-label">${msg("password")}</label>
                <input tabindex="2" id="password" name="password" class="kc-input"
                       type="password" autocomplete="off"
                       placeholder="${msg('placeholderPassword')}"/>
            </div>

            <div class="kc-checkbox-row">
                <#if realm.rememberMe && !usernameHidden??>
                    <label class="kc-checkbox-label">
                        <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" <#if login.rememberMe??>checked</#if>>
                        <span>${msg("rememberMe")}</span>
                    </label>
                <#else>
                    <span></span>
                </#if>

                <#if realm.resetPasswordAllowed>
                    <a tabindex="5" href="${url.loginResetCredentialsUrl}" class="kc-link">${msg("doForgotPassword")}</a>
                </#if>
            </div>

            <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
            <button tabindex="4" class="kc-btn-primary" name="login" id="kc-login" type="submit">
                ${msg("doLogIn")}
            </button>
        </form>
    <#elseif section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div class="kc-register-prompt">
                <span>${msg("noAccount")} </span>
                <a tabindex="6" href="${url.registrationUrl}" class="kc-link">${msg("doRegister")}</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
