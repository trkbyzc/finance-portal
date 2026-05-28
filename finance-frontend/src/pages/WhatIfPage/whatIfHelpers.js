/**
 * WhatIfPage ve alt komponentleri için paylaşılan sabitler/helper'lar.
 * Asset chip ve recharts Line aynı index'te aynı rengi kullansın diye PALETTE shared.
 */
export const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export const fmtTry = (v) =>
    Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
