# Finans Portalı — Frontend

[English](README.md) · **Türkçe**

**React 19 + Vite** tek-sayfa uygulaması: dashboard, piyasa listeleri, varlık detayı & grafikler, portföy, izleme listesi, alarmlar, simülasyon/What-If, haberler ve YZ sohbet widget'ı. Backend ile REST (`/api/v1`) üzerinden konuşur ve Keycloak (OIDC) ile kimlik doğrular.

> Tüm proje genel bakışı ve tek komutla başlatma için **[kök README](../README.tr.md)**'ye bak.

## Önkoşullar

- **Node.js 20+** ve **npm**
- Çalışan bir **backend** + **Keycloak** (en kolayı: `../finance_portal`'dan `docker compose up -d` — kök README'ye bak)

## Çalıştırma (dev)

```bash
npm install
npm run dev        # Vite dev sunucusu → http://localhost:5173
```

Uygulamayı backend ve Keycloak'a yönlendirmek için `.env.local` oluştur:

```env
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=finance-realm
VITE_KEYCLOAK_CLIENT_ID=finance-client
VITE_APP_URL=http://localhost:5173
```

> Docker imajında bunlar build arg olarak verilir ve API'ye `/api/v1` nginx proxy'si üzerinden erişilir.

## Scriptler

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Vite dev sunucusu (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Production build'i yerelde önizle |
| `npm run test` | Birim/bileşen testleri (Vitest) |
| `npm run test:coverage` | Kapsam raporuyla testler |
| `npm run lint` | ESLint ile lint |

## Teknoloji

React 19 · Vite · React Router · TanStack React Query · Axios · Tailwind CSS · i18next (TR/EN) · KLineCharts / Lightweight-Charts / Recharts · Vitest + Testing Library

## Yapı

```
src/
├── pages/        # route seviyesi sayfalar (Dashboard, AssetDetail, Portfolio, …)
├── components/   # tekrar kullanılabilir bileşenler (layout, charts, portfolio, news, chat, ui)
├── context/      # global state (Auth, Theme, Currency, Notification)
├── hooks/        # veri/mantık hook'ları (React Query) + grafik hook'ları
├── config/       # apiClient (axios) ve grafik overlay config
├── constants/    # tema token'ları, varlık/kategori sabitleri
├── i18n/         # i18next config + locales/{tr,en}
└── utils/        # token yöneticisi, Keycloak yardımcıları, formatlayıcılar
```

## Lisans

MIT — [kök LICENSE](../LICENSE).
