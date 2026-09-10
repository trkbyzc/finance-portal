import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimulationCard from './SimulationCard';

const t = (k, def) => (typeof def === 'object' ? k : def || k);

const baseSim = {
    symbol: 'THYAO',
    assetType: 'STOCK',
    investmentDate: '2024-01-15',
    amountTry: 10000,
    notes: '',
    result: {
        series: [{ date: '2024-02', value: 11000 }],
        currentValue: 11500,
        pnlTry: 1500,
        pnlPct: 15,
    },
};

describe('SimulationCard', () => {
    it('symbol + asset type label render', () => {
        render(<SimulationCard sim={baseSim} t={t} onDetail={() => {}} onDelete={() => {}} />);
        expect(screen.getByText('THYAO')).toBeInTheDocument();
    });

    it('amount TR formatted', () => {
        render(<SimulationCard sim={baseSim} t={t} onDetail={() => {}} onDelete={() => {}} />);
        expect(screen.getByText(/10\.000,00/)).toBeInTheDocument();
    });

    it('positive PnL → buy renkli + TrendingUp', () => {
        const { container } = render(<SimulationCard sim={baseSim} t={t} onDetail={() => {}} onDelete={() => {}} />);
        expect(container.innerHTML).toContain('text-buy');
        expect(screen.getByText(/\+15\.00%/)).toBeInTheDocument();
    });

    it('negative PnL → sell renkli + TrendingDown', () => {
        const negSim = { ...baseSim, result: { ...baseSim.result, pnlTry: -500, pnlPct: -5 } };
        const { container } = render(<SimulationCard sim={negSim} t={t} onDetail={() => {}} onDelete={() => {}} />);
        expect(container.innerHTML).toContain('text-sell');
    });

    it('warning olduğunda result yerine warning bloku', () => {
        const warnSim = { ...baseSim, result: { warning: 'Veri yetersiz' } };
        render(<SimulationCard sim={warnSim} t={t} onDetail={() => {}} onDelete={() => {}} />);
        expect(screen.getByText('Veri yetersiz')).toBeInTheDocument();
    });

    it('notes varsa altında render', () => {
        const noteSim = { ...baseSim, notes: 'Test notu' };
        render(<SimulationCard sim={noteSim} t={t} onDetail={() => {}} onDelete={() => {}} />);
        expect(screen.getByText('Test notu')).toBeInTheDocument();
    });

    it('onDetail butonuna tık → handler çağrılır', () => {
        const onDetail = vi.fn();
        render(<SimulationCard sim={baseSim} t={t} onDetail={onDetail} onDelete={() => {}} />);
        fireEvent.click(screen.getByText('simulation:actions.viewChart'));
        expect(onDetail).toHaveBeenCalled();
    });

    it('onDelete trash ikonu → handler çağrılır', () => {
        const onDelete = vi.fn();
        const { container } = render(<SimulationCard sim={baseSim} t={t} onDetail={() => {}} onDelete={onDelete} />);
        const trashBtn = container.querySelector('button[title]');
        fireEvent.click(trashBtn);
        expect(onDelete).toHaveBeenCalled();
    });

    it('hasResult=false iken viewChart butonu disabled', () => {
        const noResultSim = { ...baseSim, result: { series: [], pnlTry: 0, pnlPct: 0 } };
        const { container } = render(<SimulationCard sim={noResultSim} t={t} onDetail={() => {}} onDelete={() => {}} />);
        const viewBtn = container.querySelector('button[class*="disabled:opacity-40"]');
        expect(viewBtn).toBeDisabled();
    });

    it('null result safe parse', () => {
        const nullSim = { ...baseSim, result: null };
        // Should not crash
        expect(() => render(<SimulationCard sim={nullSim} t={t} onDetail={() => {}} onDelete={() => {}} />))
            .not.toThrow();
    });
});
