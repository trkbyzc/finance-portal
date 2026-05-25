<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm'); section>
    <#if section = "header">
        <h1 class="kc-form-title">${msg("doRegister")}</h1>
        <p class="kc-form-subtitle">${msg("registerPageSubtitle")}</p>
    <#elseif section = "form">
        <form id="kc-register-form" action="${url.registrationAction}" method="post">

            <div class="kc-row">
                <div class="kc-form-group">
                    <label for="firstName" class="kc-label">${msg("firstName")}</label>
                    <input type="text" id="firstName" name="firstName" class="kc-input"
                           value="${(register.formData.firstName!'')}"
                           placeholder="${msg('placeholderFirstName')}" />
                </div>
                <div class="kc-form-group">
                    <label for="lastName" class="kc-label">${msg("lastName")}</label>
                    <input type="text" id="lastName" name="lastName" class="kc-input"
                           value="${(register.formData.lastName!'')}"
                           placeholder="${msg('placeholderLastName')}" />
                </div>
            </div>

            <div class="kc-form-group">
                <label for="email" class="kc-label">${msg("email")}</label>
                <input type="text" id="email" name="email" class="kc-input"
                       value="${(register.formData.email!'')}"
                       autocomplete="email"
                       placeholder="${msg('placeholderEmail')}" />
            </div>

            <div class="kc-form-group">
                <label for="username" class="kc-label">${msg("username")}</label>
                <input type="text" id="username" name="username" class="kc-input"
                       value="${(register.formData.username!'')}"
                       autocomplete="username"
                       placeholder="${msg('placeholderRegisterUsername')}" />
            </div>

            <div class="kc-form-group">
                <label for="password" class="kc-label">${msg("password")}</label>
                <input type="password" id="password" name="password" class="kc-input"
                       autocomplete="new-password"
                       placeholder="${msg('placeholderStrongPassword')}" />
            </div>

            <div class="kc-form-group">
                <label for="password-confirm" class="kc-label">${msg("passwordConfirm")}</label>
                <input type="password" id="password-confirm" name="password-confirm" class="kc-input"
                       placeholder="${msg('placeholderRepeatPassword')}" />
            </div>

            <button class="kc-btn-primary" type="submit">${msg("doRegister")}</button>
        </form>

        <div class="kc-register-prompt">
            <span>${msg("haveAccount")} </span>
            <a href="${url.loginUrl}" class="kc-link">${msg("doLogIn")}</a>
        </div>
    </#if>
</@layout.registrationLayout>
