import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, fb) => (typeof fb === 'string' ? fb : k) }),
}));
vi.mock('../layout/PromptModal', () => ({
    default: ({ open, onSubmit, onCancel, title }) =>
        open ? <div data-testid="prompt">
            <span>{title}</span>
            <button onClick={() => onSubmit('NewName')}>submit</button>
            <button onClick={onCancel}>cancel</button>
        </div> : null,
}));
vi.mock('../layout/Modal', () => ({
    default: ({ isOpen, onClose, onCancel, title }) =>
        isOpen ? <div data-testid="modal">
            <span>{title}</span>
            <button onClick={onClose}>confirm</button>
            <button onClick={onCancel}>cancel</button>
        </div> : null,
}));

import PortfolioSwitcher from './PortfolioSwitcher';

const portfolios = [
    { id: 1, name: 'Ana', itemCount: 5 },
    { id: 2, name: 'Emeklilik', itemCount: 2 },
];
const baseProps = (overrides = {}) => ({
    portfolios, activeId: 1,
    onSelect: vi.fn(), onCreate: vi.fn(), onRename: vi.fn(), onDelete: vi.fn(),
    ...overrides,
});

describe('PortfolioSwitcher', () => {
    let props;
    beforeEach(() => { props = baseProps(); });

    it('aktif portföy adı butonda görünür', () => {
        render(<PortfolioSwitcher {...props} />);
        expect(screen.getByText('Ana')).toBeInTheDocument();
    });

    it('button click → dropdown açılır + tüm portföyler listelenir', () => {
        render(<PortfolioSwitcher {...props} />);
        fireEvent.click(screen.getByText('Ana'));
        expect(screen.getAllByText('Ana').length).toBeGreaterThan(0);
        expect(screen.getByText('Emeklilik')).toBeInTheDocument();
    });

    it('item tıklayınca onSelect çağrılır + dropdown kapanır', () => {
        render(<PortfolioSwitcher {...props} />);
        fireEvent.click(screen.getByText('Ana'));
        fireEvent.click(screen.getByText('Emeklilik'));
        expect(props.onSelect).toHaveBeenCalledWith(2);
    });

    it('Create button → PromptModal mode=create açılır', () => {
        render(<PortfolioSwitcher {...props} />);
        fireEvent.click(screen.getByText('Ana'));
        fireEvent.click(screen.getByText('Yeni Portföy'));
        expect(screen.getByTestId('prompt')).toBeInTheDocument();
    });

    it('Create submit → onCreate çağrılır', () => {
        render(<PortfolioSwitcher {...props} />);
        fireEvent.click(screen.getByText('Ana'));
        fireEvent.click(screen.getByText('Yeni Portföy'));
        fireEvent.click(screen.getByText('submit'));
        expect(props.onCreate).toHaveBeenCalledWith('NewName');
    });

    it('Rename button → PromptModal mode=rename açılır + submit', () => {
        const { container } = render(<PortfolioSwitcher {...props} />);
        fireEvent.click(screen.getByText('Ana'));
        const renameBtn = container.querySelector('button[title="Yeniden adlandır"]');
        fireEvent.click(renameBtn);
        fireEvent.click(screen.getByText('submit'));
        expect(props.onRename).toHaveBeenCalled();
    });

    it('Delete butonu — len>1 → görünür ve onDelete çağrılır', () => {
        const { container } = render(<PortfolioSwitcher {...props} />);
        fireEvent.click(screen.getByText('Ana'));
        const delBtns = container.querySelectorAll('button[title="Sil"]');
        expect(delBtns.length).toBe(2);
        fireEvent.click(delBtns[0]);
        // confirm modal'ı görünmeli
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        fireEvent.click(screen.getByText('confirm'));
        expect(props.onDelete).toHaveBeenCalledWith(1);
    });

    it('Tek portföy varsa delete butonu görünmez', () => {
        const single = baseProps({ portfolios: [{ id: 9, name: 'X', itemCount: 0 }] });
        const { container } = render(<PortfolioSwitcher {...single} />);
        fireEvent.click(screen.getByText('X'));
        expect(container.querySelectorAll('button[title="Sil"]').length).toBe(0);
    });

    it('dış mousedown → dropdown kapanır', () => {
        render(<PortfolioSwitcher {...props} />);
        fireEvent.click(screen.getByText('Ana'));
        expect(screen.getByText('Emeklilik')).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByText('Emeklilik')).toBeNull();
    });
});
