-- FinansPortal Chatbot: kullanıcı sohbetleri + mesajlar.
-- Bir kullanıcı birden fazla sohbet (Conversation) açabilir.
-- Her Conversation'ın altında sıralı mesajlar (USER / ASSISTANT / SYSTEM / TOOL) durur.

CREATE TABLE IF NOT EXISTS chat_conversations (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_updated ON chat_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
    id              UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(16) NOT NULL,            -- USER | ASSISTANT | SYSTEM | TOOL
    content         TEXT,
    tool_calls      TEXT,                            -- JSON: assistant'ın çağırdığı tool'lar
    tool_name       VARCHAR(64),                     -- role=TOOL ise hangi tool'un sonucu
    model_used      VARCHAR(64),                     -- assistant mesajını üreten model (groq/gemini + model adı)
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv_created ON chat_messages(conversation_id, created_at);
