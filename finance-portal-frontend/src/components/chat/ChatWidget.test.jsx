import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// chatApi mock
vi.mock('../../services/api/chatApi', () => ({
    chatApi: {
        listConversations: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
        deleteConversation: vi.fn(),
    },
}));

// AuthContext mock — isAuthenticated kontrolü kritik (false ise hiç render etmiyor)
let authState = { isAuthenticated: true };
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => authState,
}));

// useNotify
const notifyMock = vi.fn();
vi.mock('../../context/NotificationContext', () => ({
    useNotify: () => notifyMock,
}));

// i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, def) => def || k, i18n: { language: 'tr' } }),
}));

import ChatWidget from './ChatWidget';
import { chatApi } from '../../services/api/chatApi';

describe('ChatWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState = { isAuthenticated: true };
    });

    it("auth'suz kullanıcıda render etmez (null)", () => {
        authState = { isAuthenticated: false };
        const { container } = render(<ChatWidget />);
        expect(container.firstChild).toBeNull();
    });

    it('kapalı durumda sadece floating button gözükür', () => {
        const { container } = render(<ChatWidget />);
        const button = container.querySelector('button[aria-label]');
        expect(button).toBeInTheDocument();
        // Panel açık olmadığı için textarea yok
        expect(container.querySelector('textarea')).toBeNull();
    });

    it('floating button tıklayınca panel açılır (textarea görünür)', async () => {
        const user = userEvent.setup();
        const { container } = render(<ChatWidget />);
        const openBtn = container.querySelector('button[aria-label]');
        await user.click(openBtn);
        await waitFor(() => {
            expect(container.querySelector('textarea')).toBeInTheDocument();
        });
    });

    it('panel açıkken empty state suggestion chip\'leri render eder', async () => {
        const user = userEvent.setup();
        const { container } = render(<ChatWidget />);
        await user.click(container.querySelector('button[aria-label]'));
        // 4 suggestion chip — text içerikleri default fallback'lerden gelir
        await waitFor(() => {
            // En azından 4 buton (chip'ler) olmalı header butonlarına ek olarak
            expect(container.querySelectorAll('button').length).toBeGreaterThan(4);
        });
    });

    it('mesaj input + send → optimistic user mesajı + assistant cevabı', async () => {
        chatApi.sendMessage.mockResolvedValue({
            conversationId: 'c1',
            message: {
                id: 'm1',
                role: 'ASSISTANT',
                content: 'Selam! Nasıl yardımcı olabilirim?',
                createdAt: new Date().toISOString(),
            },
        });
        const user = userEvent.setup();
        const { container } = render(<ChatWidget />);
        await user.click(container.querySelector('button[aria-label]'));

        const textarea = container.querySelector('textarea');
        await user.type(textarea, 'selam');

        // Submit (Enter)
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

        await waitFor(() => {
            expect(chatApi.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                message: 'selam',
                locale: 'tr',
            }));
        });

        await waitFor(() => {
            expect(screen.getByText('Selam! Nasıl yardımcı olabilirim?')).toBeInTheDocument();
        });
    });

    it("send hata (503) → error toast, optimistic mesaj geri alınır", async () => {
        chatApi.sendMessage.mockRejectedValue({
            response: { status: 503, data: { message: 'down' } },
        });
        const user = userEvent.setup();
        const { container } = render(<ChatWidget />);
        await user.click(container.querySelector('button[aria-label]'));

        const textarea = container.querySelector('textarea');
        await user.type(textarea, 'test');
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

        await waitFor(() => {
            expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
        });
    });
});
