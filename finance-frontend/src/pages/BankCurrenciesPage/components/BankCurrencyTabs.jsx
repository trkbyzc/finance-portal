import React from 'react';
import { DollarSign, Euro, PoundSterling } from 'lucide-react';

export const TABS = [
    { id: 'USD', label: 'ABD DOLARI', icon: <DollarSign size={18} /> },
    { id: 'EUR', label: 'EURO', icon: <Euro size={18} /> },
    { id: 'GBP', label: 'İNGİLİZ STERLİNİ', icon: <PoundSterling size={18} /> },
];

export default function BankCurrencyTabs({ selectedCurrency, setSelectedCurrency }) {
    return (
        <div className="flex gap-4 mb-8 border-b border-[#2a2e39] pb-px">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setSelectedCurrency(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                        selectedCurrency === tab.id
                            ? 'border-[#2962ff] text-white bg-[#2962ff]/10 rounded-t-lg'
                            : 'border-transparent text-[#868993] hover:text-white hover:bg-[#1e222d] rounded-t-lg'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}