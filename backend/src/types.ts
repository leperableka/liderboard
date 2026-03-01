// Telegram user extracted from verified initData
export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
}

// Database row shapes
export interface UserRow {
  id: number;
  telegram_id: string;
  username: string | null;
  display_name: string;
  photo_url: string | null;
  market: 'crypto' | 'moex' | 'forex';
  instruments: string[];
  initial_deposit: string;
  currency: string;
  registered_at: Date;
  consented_pd: boolean;
  consented_rules: boolean;
}

export interface DepositUpdateRow {
  id: number;
  user_id: number;
  deposit_date: string;
  deposit_value: string;
  created_at: Date;
  updated_at: Date;
}

// Public-facing profile shape
export interface UserProfile {
  id: number;
  telegram_id: string;
  display_name: string;
  photo_url: string | null;
  market: 'crypto' | 'moex' | 'forex';
  instruments: string[];
  initial_deposit: number;
  currency: string;
  registered_at: string;
}

export interface LeaderboardEntry {
  position: number;
  telegramId: number;
  displayName: string;
  avatarUrl: string | null;
  market: 'crypto' | 'moex' | 'forex';
  instruments: string[];
  pnlPercent: number;
  isCurrentUser: boolean;
  depositCategory: number | null;
}

export type LeaderboardCategory = 'all' | '1' | '2' | '3';
