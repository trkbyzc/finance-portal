/**
 * Frontend assetCategory → backend AssetType enum.
 *
 * Backend enum: CRYPTO, FUTURE, FUND, STOCK, COMMODITY, CURRENCY, BOND
 * Frontend kategori isimleri bazen daha ince taneli (VIOP, TR_BOND, EUROBOND, TR_FUND, INDEX)
 * — bu mapping onları backend enum'a çevirir.
 */
export const toBackendAssetType = (category) => {
    const map = {
        VIOP: 'FUTURE',
        TR_BOND: 'BOND',
        EUROBOND: 'BOND',
        TR_FUND: 'FUND',
        INDEX: 'STOCK'
    };
    return map[category] || category || 'STOCK';
};
