package com.financeportal.service.chat.llm;

import lombok.Getter;

/**
 * LLM provider hataları için ortak tip.
 * retriable=true → LlmGateway fallback provider'a geçer.
 * retriable=false → kullanıcıya doğrudan yansır (4xx tipi config hatası vs.).
 */
@Getter
public class LlmException extends RuntimeException {

    private final boolean retriable;
    private final int statusCode;

    public LlmException(String message, boolean retriable, int statusCode) {
        super(message);
        this.retriable = retriable;
        this.statusCode = statusCode;
    }

    public LlmException(String message, Throwable cause, boolean retriable, int statusCode) {
        super(message, cause);
        this.retriable = retriable;
        this.statusCode = statusCode;
    }
}
