import { getFlagUrl } from '../../../utils/currencyUtils';

/**
 * Banka kuru sekmeleri — kur listesi veriden DİNAMİK gelir (HesapKurdu ne döndürürse).
 * Eskiden USD/EUR/GBP sabitti; oysa API 17 kur (TCMB'nin 12'si dahil) döndürüyor.
 * Sıralama BankCurrenciesPage'te yapılır (TCMB önceliği + ekstralar).
 */
export default function BankCurrencyTabs({ currencies = [], selectedCurrency, setSelectedCurrency }) {
    return (
        <div className="flex gap-2 mb-8 border-b border-border pb-px overflow-x-auto hide-scrollbar">
            {currencies.map(code => (
                <button
                    key={code}
                    onClick={() => setSelectedCurrency(code)}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap shrink-0 ${
                        selectedCurrency === code
                            ? 'border-primary text-text bg-primary/10 rounded-t-lg'
                            : 'border-transparent text-text-muted hover:text-text hover:bg-surface-2 rounded-t-lg'
                    }`}
                >
                    <img
                        src={getFlagUrl(code)}
                        alt={code}
                        className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {code}
                </button>
            ))}
        </div>
    );
}
