# LDAP kullanici federasyonunu kaldir: openldap yalnizca yerel gelistirme
# compose'unda var, canlida yok. Kalirsa Keycloak her kullanici aramasinda
# ldap://openldap:389 adresini arar, UnknownHostException alir ve girisi
# "beklenmeyen hata" ile komple cokertir. Hicbir kullanici LDAP'a bagli degil
# (federationLink hepsinde null), o yuzden kaldirmak veri kaybettirmez.
del(.components["org.keycloak.storage.UserStorageProvider"])

# Yalnizca README'de belgelenen uc hesabi birak; gelistirme artigi test
# hesaplari (test1, testuser1..6, user1, demouser1, financeuser1) canlida durmasin.
| .users = [
    .users[]
    | select(.username == "demouser" or .username == "superadmin" or .username == "financeuser")

    # Disa aktarilan hash'ler README'deki parolalarla ortusmuyordu (demouser
    # "gecersiz sifre" aliyordu). Belgelenen parolalari duz metin olarak veriyoruz;
    # Keycloak ice aktarirken kendisi hash'ler. Bunlar zaten herkese acik README'de
    # ilan edilen demo kimlik bilgileri.
    | if .username == "demouser" then
        # demouser = surtunmesiz demo hesabi. OTP kimlik bilgisi bilerek dusuruldu:
        # ziyaretci 2FA kodu uretemeyecegi icin hesap kullanilamaz hale geliyordu.
        # 2FA gosterimi financeuser'da duruyor (CONFIGURE_TOTP gerekli eylemi).
        .credentials = [{"type":"password","value":"test123","temporary":false}]
      elif .username == "superadmin" then
        .credentials = [{"type":"password","value":"superadmin","temporary":false}]
      else
        .credentials = [{"type":"password","value":"finance123","temporary":false}]
      end
  ]
