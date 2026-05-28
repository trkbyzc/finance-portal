/**
 * CreateSimulationModal'ın step-1 grid'i. uiKey i18n simulation.types.* ile eşleşir,
 * sub field ekstra i18n key (simulation.types.{uiKey}Sub) ile alt açıklama gösterir.
 */
export const SIM_ASSET_TYPES = [
    { uiKey: 'STOCK',     backendValue: 'STOCK',     endpoint: '/market-data/stocks' },
    { uiKey: 'CRYPTO',    backendValue: 'CRYPTO',    endpoint: '/market-data/crypto-currencies' },
    { uiKey: 'CURRENCY',  backendValue: 'CURRENCY',  endpoint: '/market-data/currencies' },
    { uiKey: 'GOLD',      backendValue: 'COMMODITY', endpoint: '/market-data/turkish-gold' },
    { uiKey: 'COMMODITY', backendValue: 'COMMODITY', endpoint: '/market-data/commodities' },
    { uiKey: 'BOND_TR',   backendValue: 'BOND',      endpoint: '/market-data/tr-bonds' },
    { uiKey: 'BOND',      backendValue: 'BOND',      endpoint: '/market-data/bonds' },
    { uiKey: 'FUND',      backendValue: 'FUND',      endpoint: '/market-data/tr-funds' }
];
