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
                    <#if messagesPerField.existsError('firstName')>
                        <span class="kc-field-error">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</span>
                    </#if>
                </div>
                <div class="kc-form-group">
                    <label for="lastName" class="kc-label">${msg("lastName")}</label>
                    <input type="text" id="lastName" name="lastName" class="kc-input"
                           value="${(register.formData.lastName!'')}"
                           placeholder="${msg('placeholderLastName')}" />
                    <#if messagesPerField.existsError('lastName')>
                        <span class="kc-field-error">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</span>
                    </#if>
                </div>
            </div>

            <div class="kc-form-group">
                <label for="email" class="kc-label">${msg("email")}</label>
                <input type="text" id="email" name="email" class="kc-input"
                       value="${(register.formData.email!'')}"
                       autocomplete="email"
                       placeholder="${msg('placeholderEmail')}" />
                <#if messagesPerField.existsError('email')>
                    <span class="kc-field-error">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
                </#if>
            </div>

            <div class="kc-form-group">
                <label for="username" class="kc-label">${msg("username")}</label>
                <input type="text" id="username" name="username" class="kc-input"
                       value="${(register.formData.username!'')}"
                       autocomplete="username"
                       placeholder="${msg('placeholderRegisterUsername')}" />
                <#if messagesPerField.existsError('username')>
                    <span class="kc-field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                </#if>
            </div>

            <div class="kc-form-group">
                <label for="password" class="kc-label">${msg("password")}</label>
                <div class="kc-password-wrap">
                    <input type="password" id="password" name="password" class="kc-input"
                           autocomplete="new-password"
                           placeholder="${msg('placeholderStrongPassword')}" />
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
                <#if messagesPerField.existsError('password')>
                    <span class="kc-field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                </#if>
            </div>

            <div class="kc-form-group">
                <label for="password-confirm" class="kc-label">${msg("passwordConfirm")}</label>
                <div class="kc-password-wrap">
                    <input type="password" id="password-confirm" name="password-confirm" class="kc-input"
                           placeholder="${msg('placeholderRepeatPassword')}" />
                    <button type="button" class="kc-password-toggle" data-target="password-confirm"
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
                <#if messagesPerField.existsError('password-confirm')>
                    <span class="kc-field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
                </#if>
            </div>

            <button class="kc-btn-primary" type="submit">${msg("doRegister")}</button>
        </form>

        <div class="kc-register-prompt">
            <span>${msg("haveAccount")} </span>
            <a href="${url.loginUrl}" class="kc-link">${msg("doLogIn")}</a>
        </div>
    </#if>
</@layout.registrationLayout>
