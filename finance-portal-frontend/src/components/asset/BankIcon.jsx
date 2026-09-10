import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { bankLogo } from '../../utils/bankLogo';

/**
 * Banka/döviz bürosu logosu — favicon varsa onu, yoksa (ya da yüklenemezse) jenerik banka ikonu.
 * Mevcut stilli kutuların İÇİNE yerleştirilmek üzere tasarlandı (kutu/çerçeve çağıran tarafta kalır).
 */
export default function BankIcon({
    name,
    iconSize = 20,
    iconClassName = 'text-text-muted',
    imgClassName = 'w-full h-full object-contain p-1'
}) {
    const [failed, setFailed] = useState(false);
    const url = bankLogo(name);

    if (url && !failed) {
        return (
            <img
                src={url}
                alt=""
                className={imgClassName}
                loading="lazy"
                onError={() => setFailed(true)}
            />
        );
    }
    return <Building2 size={iconSize} className={iconClassName} />;
}
