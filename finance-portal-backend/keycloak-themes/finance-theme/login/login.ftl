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
                <div class="kc-password-wrap">
                    <input tabindex="2" id="password" name="password" class="kc-input"
                           type="password" autocomplete="off"
                           placeholder="${msg('placeholderPassword')}"/>
                    <button type="button" class="kc-password-toggle" data-target="password"
                            tabindex="-1" aria-label="${msg('showPassword')}"
                            data-show-label="${msg('showPassword')}" data-hide-label="${msg('hidePassword')}">
                        <svg class="kc-eye kc-eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg class="kc-eye kc-eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
                <#if messagesPerField.existsError('username','password')>
                    <span class="kc-field-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                    </span>
                </#if>
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
