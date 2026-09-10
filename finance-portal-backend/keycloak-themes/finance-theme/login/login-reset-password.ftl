<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username') displayInfo=true; section>
    <#if section = "header">
        <h1 class="kc-form-title">${msg("emailForgotTitle")}</h1>
        <p class="kc-form-subtitle">${msg("emailInstruction")}</p>
    <#elseif section = "form">
        <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
            <div class="kc-form-group">
                <label for="username" class="kc-label"><#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></label>
                <input type="text" id="username" name="username" class="kc-input" autofocus
                       value="${(auth.attemptedUsername!'')}"
                       aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                       placeholder="${msg('placeholderUsername')}"/>
                <#if messagesPerField.existsError('username')>
                    <span class="kc-field-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}
                    </span>
                </#if>
            </div>

            <button class="kc-btn-primary" type="submit">${msg("doSubmit")}</button>
        </form>
    <#elseif section = "info">
        <div class="kc-register-prompt">
            <a href="${url.loginUrl}" class="kc-link">${kcSanitize(msg("backToLogin"))?no_esc}</a>
        </div>
    </#if>
</@layout.registrationLayout>
