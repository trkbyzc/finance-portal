import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (k, opts) => {
            if (opts && opts.days != null) return `days:${opts.days}`;
            if (opts && opts.date != null) return `date:${opts.date}`;
            return k;
        }
    })
}));
vi.mock('../../utils/formatters/dateFormatter', () => ({
    formatDate: (d) => `FMT:${d}`,
}));

import BanNoticeModal from './BanNoticeModal';

describe('BanNoticeModal', () => {
    it('info null → null render', () => {
        const { container } = render(<BanNoticeModal info={null} onClose={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('PERMANENT ban → permanentBody + tarih kutusu YOK', () => {
        const { container } = render(
            <BanNoticeModal info={{ banType: 'PERMANENT', message: 'banned' }} onClose={() => {}} />
        );
        expect(screen.getByText('ban.permanentBody')).toBeInTheDocument();
        expect(container.textContent).not.toContain('days:');
    });

    it('until=null → permanent gibi davranır', () => {
        render(<BanNoticeModal info={{ banType: 'TEMPORARY', until: null }} onClose={() => {}} />);
        expect(screen.getByText('ban.permanentBody')).toBeInTheDocument();
    });

    it('TEMPORARY + until + daysLeft → tempBody + daysLeft + unlockOn', () => {
        render(
            <BanNoticeModal
                info={{ banType: 'TEMPORARY', until: '2026-12-31', daysLeft: 5 }}
                onClose={() => {}}
            />
        );
        expect(screen.getByText('ban.tempBody')).toBeInTheDocument();
        expect(screen.getByText('days:5')).toBeInTheDocument();
        expect(screen.getByText('date:FMT:2026-12-31')).toBeInTheDocument();
    });

    it('Close butonu → onClose çağrılır', () => {
        const onClose = vi.fn();
        render(<BanNoticeModal info={{ banType: 'PERMANENT' }} onClose={onClose} />);
        fireEvent.click(screen.getByText('ban.close'));
        expect(onClose).toHaveBeenCalled();
    });

    it('ban title her durumda render', () => {
        render(<BanNoticeModal info={{ banType: 'PERMANENT' }} onClose={() => {}} />);
        expect(screen.getByText('ban.title')).toBeInTheDocument();
    });
});
