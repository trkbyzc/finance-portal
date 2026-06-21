<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if requiredActions??>
            <h1 class="kc-form-title"><#list requiredActions><#items as reqActionItem>${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}<#sep>, </#items></#list></h1>
            <p class="kc-form-subtitle">${kcSanitize(message.summary)?no_esc}</p>
        <#else>
            <h1 class="kc-form-title">${kcSanitize(message.summary)?no_esc}</h1>
        </#if>
    <#elseif section = "form">
        <#if !(skipLink??)>
            <#if pageRedirectUri?has_content>
                <a href="${pageRedirectUri}" class="kc-btn-primary" style="display:block;text-align:center;text-decoration:none;">${kcSanitize(msg("backToApplication"))?no_esc}</a>
            <#elseif actionUri?has_content>
                <a href="${actionUri}" class="kc-btn-primary" style="display:block;text-align:center;text-decoration:none;">${kcSanitize(msg("proceedWithAction"))?no_esc}</a>
            <#elseif (client.baseUrl)?has_content>
                <a href="${client.baseUrl}" class="kc-btn-primary" style="display:block;text-align:center;text-decoration:none;">${kcSanitize(msg("backToApplication"))?no_esc}</a>
            </#if>
        </#if>
    </#if>
</@layout.registrationLayout>
