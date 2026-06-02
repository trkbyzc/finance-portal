<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false compact=true; section>
    <#if section = "header">
        <h1 class="kc-form-title">${msg("logoutConfirmTitle")}</h1>
    <#elseif section = "form">
        <p class="kc-instruction">${msg("logoutConfirmBody")}</p>

        <form class="kc-form-card-inner" action="${(url.logoutConfirmAction)!''}" method="POST">
            <input type="hidden" name="session_code" value="${(logoutConfirm.code)!''}">

            <button tabindex="1" class="kc-btn-primary kc-btn-danger" type="submit" name="confirmLogout" id="kc-logout">
                ${msg("doConfirmLogout")}
            </button>

            <a href="http://localhost:5173" class="kc-back-link">${msg("backToApp")}</a>
        </form>
    </#if>
</@layout.registrationLayout>
