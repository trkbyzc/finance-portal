import { Fragment } from 'react';

/**
 * 1-2-3 progress dots. step prop'una göre dolu/boş gösterir.
 * Step modal'larında ortak (Add/CreateSimulation/buy-more) — reuse edilebilir.
 */
export default function StepIndicator({ step, total = 3 }) {
    const dots = Array.from({ length: total }, (_, i) => i + 1);
    return (
        <div className="flex items-center justify-center mb-8">
            {dots.map((n, idx) => (
                <Fragment key={n}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= n ? 'bg-primary' : 'bg-surface-hover'
                    }`}>
                        {n}
                    </div>
                    {idx < dots.length - 1 && (
                        <div className={`w-16 h-1 ${step > n ? 'bg-primary' : 'bg-surface-hover'}`} />
                    )}
                </Fragment>
            ))}
        </div>
    );
}
