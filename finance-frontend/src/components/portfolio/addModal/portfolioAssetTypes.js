/**
 * AddToPortfolioModal'ın step-1 asset type grid'i için tek source of truth.
 *
 *   uiKey:         UI'da ayrı kart olarak gösterilen tip (örn. BOND_TR ile BOND ayrılır)
 *   backendValue:  Backend AssetType enum'una karşılık gelen değer
 *   endpoint:      Step-2 listesini çekmek için kullanılan market-data endpoint'i
 */
export const PORTFOLIO_ASSET_TYPES = [
    { uiKey: 'STOCK',     backendValue: 'STOCK',     endpoint: '/market-data/stocks' },
    { uiKey: 'CRYPTO',    backendValue: 'CRYPTO',    endpoint: '/market-data/crypto-currencies' },
    { uiKey: 'CURRENCY',  backendValue: 'CURRENCY',  endpoint: '/market-data/currencies' },
    { uiKey: 'GOLD',      backendValue: 'COMMODITY', endpoint: '/market-data/turkish-gold' },
    { uiKey: 'COMMODITY', backendValue: 'COMMODITY', endpoint: '/market-data/commodities' },
    { uiKey: 'BOND_TR',   backendValue: 'BOND',      endpoint: '/market-data/tr-bonds' },
    { uiKey: 'BOND',      backendValue: 'BOND',      endpoint: '/market-data/bonds' },
    { uiKey: 'FUND',      backendValue: 'FUND',      endpoint: '/market-data/tr-funds' },
    { uiKey: 'VIOP',      backendValue: 'FUTURE',    endpoint: '/market-data/viop' }
];
