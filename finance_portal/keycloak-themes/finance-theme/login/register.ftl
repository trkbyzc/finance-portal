<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm'); section>
    <#if section = "header">
        Finans Dünyasına Katıl
    <#elseif section = "form">
        <form id="kc-register-form" class="form" action="${url.registrationAction}" method="post">

            <#-- İsim Soyisim (Yan Yana) -->
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div class="form-group" style="flex: 1;">
                    <label for="firstName">Ad</label>
                    <input type="text" id="firstName" name="firstName" value="${(register.formData.firstName!'')}" placeholder="John" />
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="lastName">Soyad</label>
                    <input type="text" id="lastName" name="lastName" value="${(register.formData.lastName!'')}" placeholder="Doe" />
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 15px;">
                <label for="email">E-posta Adresi</label>
                <input type="text" id="email" name="email" value="${(register.formData.email!'')}" autocomplete="email" placeholder="john@example.com" />
            </div>

            <div class="form-group" style="margin-bottom: 15px;">
                <label for="username">Kullanıcı Adı</label>
                <input type="text" id="username" name="username" value="${(register.formData.username!'')}" autocomplete="username" placeholder="johndoe_99" />
            </div>

            <div class="form-group" style="margin-bottom: 15px;">
                <label for="password">Şifre</label>
                <input type="password" id="password" name="password" autocomplete="new-password" placeholder="Güçlü bir şifre belirleyin" />
            </div>

            <div class="form-group" style="margin-bottom: 25px;">
                <label for="password-confirm">Şifreyi Onayla</label>
                <input type="password" id="password-confirm" name="password-confirm" placeholder="Şifrenizi tekrar girin" />
            </div>

            <div id="kc-form-buttons">
                <button class="btn-primary" type="submit">
                    Hesabımı Oluştur
                </button>
            </div>
        </form>
    <#elseif section = "info">
        <div style="text-align: center; margin-top: 20px; font-size: 14px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
            <span style="color: #868993;">Zaten bir hesabınız var mı? </span>
            <a href="${url.loginUrl}" style="color: #00d2ff; text-decoration: none; font-weight: 600;">Giriş Yap</a>
        </div>
    </#if>
</@layout.registrationLayout>