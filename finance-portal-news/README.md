# Finance Portal — Haber Servisi

Finance Portal'ın ikinci çalışan parçası. RSS kaynaklarından haber başlıklarını
toplar, kategoriye ayırır, içindeki varlık adlarını etiketler, İngilizceye çevirir
ve Redis'te tutar.

## Neden ayrı bir servis

Haberlerin **veritabanı tablosu yok** ve kodun geri kalanına neredeyse hiç
bağlanmıyordu — ayrıldığında mikroservise geçmenin pahalı kısmı (veriyi bölmek,
işlem bütünlüğünü elle yeniden kurmak) hiç devreye girmedi.

Portföy tarafı bunun tam tersi: tek bir portföy değeri hesaplamak için 10 farklı
alandan fiyat okuyor. Orası bölünmez.

## Ne gerektirir

| Bağımlılık | Ne için | Zorunlu mu |
|---|---|---|
| Redis | Haber önbelleği | Evet |
| lingva | İngilizce çeviri | Hayır — erişilemezse Türkçe metinle devam eder |

Veritabanı, Keycloak, Kafka ile hiçbir işi yoktur.

## Uçlar

Hepsi `/api/v1` öneki altında (backend ile aynı, çünkü arayüz tek adres kullanır).

| Uç | Ne yapar |
|---|---|
| `GET /news` | Haber listesi (`category`, `page`, `size`, `lang`) |
| `GET /news/by-symbol` | Bir varlıkla etiketlenmiş haberler |
| `GET /news/content` | Makale metni — **canlıda kapalı**, 503 + açıklama döner |
| `POST /news/sync` | Toplamayı elle tetikler — **canlıda kapalı** |
| `GET /actuator/health` | Konteyner sağlık kontrolü |

## Çalıştırma

```bash
# Redis gerekli (backend'in compose'u zaten kaldırıyor)
./mvnw spring-boot:run
# http://localhost:8082/api/v1/news
```

Testler: `./mvnw test` — 76 test, ikisi uygulamanın gerçekten ayağa kalktığını
doğrular (yerel ve canlı profil ayrı ayrı).
