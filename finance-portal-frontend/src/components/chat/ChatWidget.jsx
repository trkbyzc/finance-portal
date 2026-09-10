import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bot, X, Send, Loader2, Plus, History, Trash2, MessageSquareText, Sparkles, AlertTriangle
} from 'lucide-react';
import { chatApi } from '../../services/api/chatApi';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';

/**
 * FinansPortal Asistanı — sağ alt floating widget.
 *
 * Kapalı durumda: sağ altta Bot ikonlu yuvarlak buton.
 * Açık durumda: alttan slide-up sliding panel (mobile fullscreen, desktop 400x600).
 *
 * Sadece authenticated kullanıcılarda render edilir.
 */
export default function ChatWidget() {
    const { isAuthenticated } = useAuth();
    const { t, i18n } = useTranslation(['chat', 'common']);
    const notify = useNotify();

    const [open, setOpen] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);     // [{id, role, content, createdAt}]
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isSending]);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    useEffect(() => {
        if (!historyOpen || !isAuthenticated) return;
        let cancelled = false;
        (async () => {
            setHistoryLoading(true);
            try {
                const list = await chatApi.listConversations();
                if (!cancelled) setConversations(list || []);
            } catch {
                if (!cancelled) notify({ type: 'error', title: t('chat:error.load') });
            } finally {
                if (!cancelled) setHistoryLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [historyOpen, isAuthenticated, t, notify]);

    const loadConversation = useCallback(async (convId) => {
        try {
            const msgs = await chatApi.getMessages(convId);
            setMessages(msgs || []);
            setConversationId(convId);
            setHistoryOpen(false);
        } catch {
            notify({ type: 'error', title: t('chat:error.load') });
        }
    }, [t, notify]);

    const startNew = useCallback(() => {
        setConversationId(null);
        setMessages([]);
        setHistoryOpen(false);
        inputRef.current?.focus();
    }, []);

    // Silme butonuna basınca confirm modal'ı tetikle (native window.confirm yerine)
    const requestDelete = useCallback((convId, e) => {
        e?.stopPropagation();
        setPendingDeleteId(convId);
    }, []);

    const confirmDelete = useCallback(async () => {
        const convId = pendingDeleteId;
        if (!convId) return;
        setPendingDeleteId(null);
        try {
            await chatApi.deleteConversation(convId);
            setConversations(prev => prev.filter(c => c.id !== convId));
            if (conversationId === convId) startNew();
            notify({ type: 'success', title: t('chat:delete.success') });
        } catch {
            notify({ type: 'error', title: t('chat:delete.failed') });
        }
    }, [pendingDeleteId, conversationId, startNew, t, notify]);

    const send = useCallback(async (text) => {
        const msg = (text ?? input).trim();
        if (!msg || isSending) return;

        // Optimistic user mesajı
        const optimistic = {
            id: 'tmp-' + Date.now(),
            role: 'USER',
            content: msg,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimistic]);
        setInput('');
        setIsSending(true);

        try {
            const data = await chatApi.sendMessage({
                conversationId,
                message: msg,
                locale: i18n.language
            });
            setConversationId(data.conversationId);
            setMessages(prev => [...prev, data.message]);
        } catch (err) {
            const status = err?.response?.status;
            const title = status === 429
                ? t('chat:error.rateLimit')
                : status === 503
                    ? t('chat:error.unavailable')
                    : t('chat:error.send');
            notify({ type: 'error', title, message: err?.response?.data?.message || '' });
            // Optimistic mesajı geri al
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        } finally {
            setIsSending(false);
        }
    }, [input, isSending, conversationId, i18n.language, t, notify]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    if (!isAuthenticated) return null;

    return (
        <>
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label={t('chat:widget.open')}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-fg shadow-2xl shadow-primary/40 hover:scale-110 transition-all flex items-center justify-center group"
                >
                    <Bot size={26} className="group-hover:rotate-12 transition-transform" strokeWidth={2.2} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-buy rounded-full border-2 border-bg" />
                </button>
            )}

            {open && (
                <div
                    className="fixed z-50 bg-surface border border-border shadow-2xl flex flex-col
                               inset-0 sm:inset-auto sm:bottom-6 sm:right-6
                               sm:w-[400px] sm:h-[600px] sm:rounded-2xl
                               animate-fade-in"
                >
                    <div className="flex items-center justify-between p-3 border-b border-border bg-surface-2/40 sm:rounded-t-2xl shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                                <Bot size={18} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-text truncate">{t('chat:header.title')}</h3>
                                <p className="text-[10px] text-text-muted truncate">{t('chat:header.subtitle')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={() => setHistoryOpen(v => !v)}
                                title={t('chat:header.history')}
                                className={`p-1.5 rounded-lg transition-colors ${historyOpen ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                            >
                                <History size={16} />
                            </button>
                            <button
                                onClick={startNew}
                                title={t('chat:header.newChat')}
                                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label={t('chat:widget.close')}
                                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {historyOpen && (
                        <div className="border-b border-border bg-bg/50 max-h-48 overflow-y-auto">
                            {historyLoading ? (
                                <div className="p-3 text-center text-text-muted text-xs">
                                    <Loader2 className="inline animate-spin" size={14} />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-3 text-center text-text-muted text-xs">
                                    {t('chat:header.noHistory')}
                                </div>
                            ) : (
                                conversations.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => loadConversation(c.id)}
                                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface-hover transition-colors text-left group ${
                                            conversationId === c.id ? 'bg-primary/10' : ''
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 min-w-0">
                                            <MessageSquareText size={12} className="text-text-muted shrink-0" />
                                            <span className="text-xs text-text truncate">{c.title || 'Sohbet'}</span>
                                        </span>
                                        <button
                                            onClick={(e) => requestDelete(c.id, e)}
                                            className="p-1 rounded text-text-muted opacity-0 group-hover:opacity-100 hover:text-sell hover:bg-sell/10 transition"
                                            title={t('chat:delete.title')}
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                        {messages.length === 0 && !isSending && (
                            <EmptyState onPick={(text) => send(text)} t={t} />
                        )}
                        {messages.map(m => (
                            <MessageBubble key={m.id} message={m} />
                        ))}
                        {isSending && <ThinkingBubble t={t} />}
                    </div>

                    <div className="border-t border-border p-3 bg-surface-2/30 sm:rounded-b-2xl shrink-0">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('chat:input.placeholder')}
                                rows={1}
                                maxLength={2000}
                                className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none max-h-24"
                            />
                            <button
                                onClick={() => send()}
                                disabled={!input.trim() || isSending}
                                className="w-9 h-9 rounded-lg bg-primary hover:bg-primary-hover text-primary-fg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shrink-0"
                                title={t('chat:input.send')}
                            >
                                {isSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={15} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-text-muted/70 text-center mt-1.5">
                            {t('chat:disclaimer')}
                        </p>
                    </div>
                </div>
            )}

            {/* Silme onay modal'ı — native window.confirm yerine sistem temasında */}
            <DeleteConfirmModal
                open={pendingDeleteId != null}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDeleteId(null)}
                t={t}
            />
        </>
    );
}

function EmptyState({ onPick, t }) {
    const suggestions = [
        t('chat:empty.suggestion1'),
        t('chat:empty.suggestion2'),
        t('chat:empty.suggestion3'),
        t('chat:empty.suggestion4')
    ];
    return (
        <div className="h-full flex flex-col items-center justify-center text-center px-4 py-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-3">
                <Sparkles size={24} strokeWidth={2} />
            </div>
            <h4 className="text-sm font-bold text-text mb-1">{t('chat:empty.title')}</h4>
            <p className="text-xs text-text-muted mb-4 max-w-xs">{t('chat:empty.subtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onPick(s)}
                        className="text-left text-xs px-3 py-2 rounded-lg bg-bg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-text"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}

function MessageBubble({ message }) {
    const isUser = message.role === 'USER';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
            {!isUser && (
                <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <Bot size={12} strokeWidth={2.2} />
                </div>
            )}
            <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    isUser
                        ? 'bg-primary text-primary-fg rounded-br-sm'
                        : 'bg-bg border border-border text-text rounded-bl-sm'
                }`}
            >
                {message.content}
            </div>
        </div>
    );
}

function DeleteConfirmModal({ open, onConfirm, onCancel, t }) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            onClick={onCancel}
            className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-fade-in"
            >
                <div className="w-12 h-12 rounded-2xl bg-sell/10 border border-sell/30 flex items-center justify-center text-sell mx-auto mb-4">
                    <AlertTriangle size={22} />
                </div>
                <h3 className="text-base font-bold text-text mb-2">{t('chat:delete.title')}</h3>
                <p className="text-text-muted text-sm leading-relaxed mb-5">{t('chat:delete.confirm')}</p>

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-lg border border-border text-text hover:bg-surface-hover text-sm font-semibold transition-colors"
                    >
                        {t('chat:delete.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-lg bg-sell hover:brightness-110 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-sell/25 transition-all"
                    >
                        <Trash2 size={14} /> {t('chat:delete.confirmButton')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ThinkingBubble({ t }) {
    return (
        <div className="flex justify-start gap-2 items-end">
            <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Bot size={12} strokeWidth={2.2} />
            </div>
            <div className="bg-bg border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-text-muted flex items-center gap-2">
                <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-xs">{t('chat:input.thinking')}</span>
            </div>
        </div>
    );
}
