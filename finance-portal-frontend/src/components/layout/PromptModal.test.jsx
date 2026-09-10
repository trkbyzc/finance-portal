import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import PromptModal from './PromptModal';

const baseProps = {
    open: true,
    title: 'Yeni Portföy',
    label: 'Portföy Adı',
    placeholder: 'örn. Emeklilik',
    defaultValue: '',
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
};

describe('PromptModal', () => {
    beforeEach(() => vi.clearAllMocks());

    it('open=false → null', () => {
        const { container } = render(<PromptModal {...baseProps} open={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('open=true → title + label + input render', () => {
        render(<PromptModal {...baseProps} />);
        expect(screen.getByText('Yeni Portföy')).toBeInTheDocument();
        expect(screen.getByText('Portföy Adı')).toBeInTheDocument();
    });

    it('defaultValue input\'a yansır', () => {
        const { container } = render(<PromptModal {...baseProps} defaultValue="Var" />);
        expect(container.querySelector('input').value).toBe('Var');
    });

    it('input boşken submit butonu disabled', () => {
        render(<PromptModal {...baseProps} />);
        const submit = screen.getByText(/actions\.confirm/);
        expect(submit.closest('button')).toBeDisabled();
    });

    it('input doluyken submit aktif', () => {
        const { container } = render(<PromptModal {...baseProps} defaultValue="X" />);
        const submit = container.querySelector('button[type="submit"]');
        expect(submit).not.toBeDisabled();
    });

    it('submit + valid input → onSubmit(trimmed)', () => {
        const onSubmit = vi.fn();
        const { container } = render(<PromptModal {...baseProps} onSubmit={onSubmit} defaultValue="  My Portfolio  " />);
        fireEvent.submit(container.querySelector('form'));
        expect(onSubmit).toHaveBeenCalledWith('My Portfolio');
    });

    it('submit boş input → onSubmit ÇAĞRILMAZ', () => {
        const onSubmit = vi.fn();
        const { container } = render(<PromptModal {...baseProps} onSubmit={onSubmit} defaultValue="   " />);
        fireEvent.submit(container.querySelector('form'));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Cancel button → onCancel', () => {
        const onCancel = vi.fn();
        render(<PromptModal {...baseProps} onCancel={onCancel} />);
        const cancelBtns = screen.getAllByText(/actions\.cancel/);
        fireEvent.click(cancelBtns[cancelBtns.length - 1].closest('button'));
        expect(onCancel).toHaveBeenCalled();
    });

    it('X butonu → onCancel', () => {
        const onCancel = vi.fn();
        const { container } = render(<PromptModal {...baseProps} onCancel={onCancel} />);
        const xBtn = container.querySelector('button[aria-label="actions.cancel"]');
        fireEvent.click(xBtn);
        expect(onCancel).toHaveBeenCalled();
    });

    it('Escape → onCancel', () => {
        const onCancel = vi.fn();
        render(<PromptModal {...baseProps} onCancel={onCancel} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalled();
    });

    it('input onChange ile state güncellenir', () => {
        const { container } = render(<PromptModal {...baseProps} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: 'Yeni' } });
        expect(input.value).toBe('Yeni');
    });
});
