export const formatIndexName = (symbol) => {
    if (!symbol) return '';
    if (symbol.includes('XU100')) return 'BIST 100';
    if (symbol.includes('XU030')) return 'BIST 30';
    if (symbol.includes('XU050')) return 'BIST 50';
    if (symbol.includes('XBANK')) return 'BIST BANKA';
    if (symbol.includes('XUSIN')) return 'BIST SINAİ';
    return symbol.replace('.IS', '');
};

export const getFlagUrl = (code) => {
    const flagMap = {
        'USD': 'us', 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp',
        'CAD': 'ca', 'CHF': 'ch', 'RUB': 'ru', 'SAR': 'sa',
        'AUD': 'au', 'NOK': 'no', 'DKK': 'dk', 'SEK': 'se'
    };
    return `https://flagcdn.com/w40/${flagMap[code] || 'un'}.png`;
};

export const getHeatmapClass = (val) => {
    if (!val || val === 0) return 'bg-transparent text-[#868993]';
    return val > 0
        ? (val < 1 ? 'bg-[#089981]/20 text-[#089981]' : val < 5 ? 'bg-[#089981]/40 text-white' : val < 15 ? 'bg-[#089981]/70 text-white' : 'bg-[#089981] text-white')
        : (val > -1 ? 'bg-[#f23645]/20 text-[#f23645]' : val > -5 ? 'bg-[#f23645]/40 text-white' : val > -15 ? 'bg-[#f23645]/70 text-white' : 'bg-[#f23645] text-white');
};