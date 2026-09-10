# Finance Portal — Frontend

**English** · [Türkçe](README.tr.md)

**React 19 + Vite** single-page application: dashboard, market lists, asset detail & charts, portfolio, watchlist, alarms, simulation/What-If, news, and the AI chat widget. Talks to the backend over REST (`/api/v1`) and authenticates via Keycloak (OIDC).

> For the full project overview and one-command stack startup, see the **[root README](../README.md)**.

## Prerequisites

- **Node.js 20+** and **npm**
- A running **backend** + **Keycloak** (easiest: `docker compose up -d` from `../finance-portal-backend` — see root README)

## Run (dev)

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
```

Create `.env.local` to point the app at your backend and Keycloak:

```env
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=finance-realm
VITE_KEYCLOAK_CLIENT_ID=finance-client
VITE_APP_URL=http://localhost:5173
```

> In the Docker image these are supplied as build args and the API is reached via an nginx proxy at `/api/v1`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run unit/component tests (Vitest) |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | Lint with ESLint |

## Tech

React 19 · Vite · React Router · TanStack React Query · Axios · Tailwind CSS · i18next (TR/EN) · KLineCharts / Lightweight-Charts / Recharts · Vitest + Testing Library

## Structure

```
src/
├── pages/        # route-level pages (Dashboard, AssetDetail, Portfolio, …)
├── components/   # reusable components (layout, charts, portfolio, news, chat, ui)
├── context/      # global state (Auth, Theme, Currency, Notification)
├── hooks/        # data/logic hooks (React Query) incl. charts hooks
├── config/       # apiClient (axios) and chart overlay config
├── constants/    # theme tokens, asset/category constants
├── i18n/         # i18next config + locales/{tr,en}
└── utils/        # token manager, Keycloak helpers, formatters
```

## License

MIT — see the [root LICENSE](../LICENSE).
