<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        Giriş Yap
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <form id="kc-form-login" action="${url.loginAction}" method="post">

                    <div class="form-group">
                        <label for="username" style="color: #a0a5b1; font-weight: 500; font-size: 14px; margin-bottom: 8px; display: block;">Kullanıcı Adı veya E-posta</label>
                        <input tabindex="1" id="username" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off" placeholder="ör. finans_uzmani" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2); color: #fff; padding: 12px 15px; outline: none; transition: border-color 0.3s ease;"/>
                    </div>

                    <div class="form-group" style="margin-top: 20px;">
                        <label for="password" style="color: #a0a5b1; font-weight: 500; font-size: 14px; margin-bottom: 8px; display: block;">Şifre</label>
                        <input tabindex="2" id="password" name="password" type="password" autocomplete="off" placeholder="••••••••" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2); color: #fff; padding: 12px 15px; outline: none; transition: border-color 0.3s ease;"/>
                    </div>

                    <div class="form-options" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 13px;">
                        <#if realm.rememberMe && !usernameHidden??>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 0;">
                                <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" style="accent-color: #00d2ff; width: 16px; height: 16px; cursor: pointer; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);" <#if login.rememberMe??>checked</#if>>
                                <span style="color: #a0a5b1; user-select: none;">Beni Hatırla</span>
                            </label>
                        </#if>

                        <#if realm.resetPasswordAllowed>
                            <a tabindex="5" href="${url.loginResetCredentialsUrl}" style="color: #00d2ff; text-decoration: none; transition: text-shadow 0.3s; font-weight: 500;">Şifremi Unuttum?</a>
                        </#if>
                    </div>

                    <div id="kc-form-buttons" style="margin-top: 30px;">
                        <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                        <button tabindex="4" class="btn-primary" name="login" id="kc-login" type="submit" style="width: 100%; background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%); color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
                            Güvenli Giriş
                        </button>
                    </div>
                </form>
            </div>
        </div>
    <#elseif section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration" style="text-align: center; margin-top: 25px; font-size: 14px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                <span style="color: #868993;">Hesabınız yok mu? </span>
                <a tabindex="6" href="${url.registrationUrl}" style="color: #00d2ff; text-decoration: none; font-weight: 600; letter-spacing: 0.5px; transition: color 0.3s ease;">Hemen Kayıt Olun</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>