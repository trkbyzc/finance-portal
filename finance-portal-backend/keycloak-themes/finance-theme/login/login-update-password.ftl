<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
        <h1 class="kc-form-title">${msg("updatePasswordTitle")}</h1>
        <p class="kc-form-subtitle">${msg("loginPageSubtitle")}</p>
    <#elseif section = "form">
        <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">

            <div class="kc-form-group">
                <label for="password-new" class="kc-label">${msg("passwordNew")}</label>
                <div class="kc-password-wrap">
                    <input tabindex="1" type="password" id="password-new" name="password-new" class="kc-input"
                           autofocus autocomplete="new-password" placeholder="${msg('placeholderPassword')}"/>
                    <button type="button" class="kc-password-toggle" data-target="password-new"
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
            </div>

            <div class="kc-form-group">
                <label for="password-confirm" class="kc-label">${msg("passwordConfirm")}</label>
                <div class="kc-password-wrap">
                    <input tabindex="2" type="password" id="password-confirm" name="password-confirm" class="kc-input"
                           autocomplete="new-password" placeholder="${msg('placeholderPassword')}"/>
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
                <#if messagesPerField.existsError('password','password-confirm')>
                    <span class="kc-field-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('password','password-confirm'))?no_esc}
                    </span>
                </#if>
            </div>

            <button tabindex="3" class="kc-btn-primary" type="submit">${msg("doSubmit")}</button>

            <#if isAppInitiatedAction??>
                <div class="kc-register-prompt">
                    <button class="kc-link" type="submit" name="cancel-aia" value="true">${msg("doCancel")}</button>
                </div>
            </#if>
        </form>
    </#if>
</@layout.registrationLayout>
