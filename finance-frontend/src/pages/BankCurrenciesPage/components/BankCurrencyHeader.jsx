import React from 'react';
import { Landmark } from 'lucide-react';

export default function BankCurrencyHeader() {
    return (
        <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 uppercase">
                <Landmark className="text-[#2962ff]" size={36} />
                Canlı Banka Kurları & Makas Aralıkları
            </h1>
            <p className="text-[#868993] mt-2 ml-12">
                Farklı bankaların uyguladığı güncel alış/satış makas (spread) oranları.
            </p>
        </div>
    );
}