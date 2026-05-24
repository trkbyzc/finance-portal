<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
    <#elseif section = "form">
        <p class="instruction-text" style="margin-bottom: 25px;">
            Finansal verilerinizin güvenliği için oturumunuzu sonlandırmak üzeresiniz. Dilerseniz çıkış yapabilir veya işlemlere geri dönebilirsiniz.
        </p>

        <form class="form-actions" action="${(url.logoutConfirmAction)!''}" method="POST">
            <input type="hidden" name="session_code" value="${(logoutConfirm.code)!''}">

            <button tabindex="1" class="btn-primary" type="submit" name="confirmLogout" id="kc-logout" style="background: linear-gradient(135deg, #e11d48, #9f1239); box-shadow: 0 4px 15px rgba(225, 29, 72, 0.3);">
                Güvenli Çıkış Yap
            </button>

            <a href="http://localhost:5173" class="back-link">« İşlemlere Geri Dön</a>
        </form>
    </#if>
</@layout.registrationLayout>