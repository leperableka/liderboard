// ─── Navigation ───────────────────────────────────────────────────────────────

export type Screen =
  | 'welcome'
  | 'registration'
  | 'leaderboard'
  | 'update-deposit'
  | 'history'
  | 'profile'
  | 'rules';

// ─── Markets & Instruments ────────────────────────────────────────────────────

export type Market = 'crypto' | 'moex' | 'forex';

export type Currency = 'USDT' | 'USD' | 'RUB';

export const MARKET_LABELS: Record<Market, string> = {
  crypto: 'Криптовалюта',
  moex: 'ММВБ',
  forex: 'Форекс',
};

export const MARKET_CURRENCY: Record<Market, Currency> = {
  crypto: 'USDT',
  moex: 'RUB',
  forex: 'USD',
};

export const MARKET_INSTRUMENTS: Record<Market, string[]> = {
  crypto: ['Спот', 'Фьючерсы', 'Опционы'],
  moex: ['Акции', 'Фьючерсы', 'Облигации', 'Опционы', 'Валюта'],
  forex: ['Валютные пары', 'CFD'],
};

// ─── Registration ─────────────────────────────────────────────────────────────

export interface RegistrationData {
  displayName: string;
  avatarUrl: string | null;
  avatarFile: File | null;
  pdConsent: boolean;
  rulesConsent: boolean;
  market: Market | null;
  instruments: string[];
  initialDeposit: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserStatus {
  registered: boolean;
  depositUpdatedToday: boolean;
  telegramId: number;
  displayName: string;
  market: Market | null;
  instruments: string[];
  initialDeposit: number;
  currentDeposit?: number;
  currency: Currency;
  avatarUrl: string | null;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardCategory = 'all' | '1' | '2' | '3';

export interface LeaderboardEntry {
  position: number;
  telegramId: number;
  displayName: string;
  avatarUrl: string | null;
  market: Market;
  instruments: string[];
  pnlPercent: number;
  isCurrentUser: boolean;
  depositCategory: number | null;
}

export interface LeaderboardResponse {
  category: LeaderboardCategory;
  totalParticipants: number;
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface DepositEntry {
  date: string;       // ISO date string e.g. "2026-02-25"
  dateLabel: string;  // e.g. "25.02"
  amount: number;
  dailyChange: number | null; // percent
}

export interface HistoryResponse {
  daysParticipated: number;
  initialDeposit: number;
  currentDeposit: number;
  pnlPercent: number;
  pnlAbsolute: number;
  currency: Currency;
  entries: DepositEntry[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  displayName: string;
  market: Market;
  instruments: string[];
  initialDeposit: number;
  avatarUrl?: string | null;
  consentedPd: boolean;
  consentedRules: boolean;
}

export interface UpdateDepositPayload {
  amount: number;
  date: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}
