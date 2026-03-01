import type {
  UserStatus,
  LeaderboardResponse,
  HistoryResponse,
  RegisterPayload,
  UpdateDepositPayload,
  LeaderboardCategory,
  Market,
  Currency,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

function getInitData(): string {
  try {
    return window.Telegram?.WebApp?.initData ?? 'mock_init_data';
  } catch {
    return 'mock_init_data';
  }
}


async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = {
    'X-Telegram-InitData': getInitData(),
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let errorMessage = `HTTP ${response.status}`;
    try {
      const parsed: { message?: string; error?: string } = JSON.parse(errorText);
      errorMessage = parsed.message ?? parsed.error ?? errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ─── Mock data for development ────────────────────────────────────────────────

const IS_DEV = import.meta.env.DEV;

function mockDelay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockStatus: UserStatus = {
  registered: true,
  depositUpdatedToday: false,
  telegramId: 123456789,
  displayName: 'Александр Кольцов',
  market: 'crypto',
  instruments: ['Спот', 'Фьючерсы'],
  initialDeposit: 5000,
  currency: 'USDT',
  avatarUrl: null,
};

const mockLeaderboard: LeaderboardResponse = {
  category: 'all',
  totalParticipants: 247,
  entries: [
    { position: 1, telegramId: 1, displayName: 'Александр К.', avatarUrl: null, market: 'crypto', instruments: ['Спот', 'Фьючерсы'], pnlPercent: 32.5, isCurrentUser: false, depositCategory: 1 },
    { position: 2, telegramId: 2, displayName: 'Дмитрий К.', avatarUrl: null, market: 'moex', instruments: ['Акции'], pnlPercent: 28.1, isCurrentUser: false, depositCategory: 2 },
    { position: 3, telegramId: 3, displayName: 'Елена В.', avatarUrl: null, market: 'forex', instruments: ['Валютные пары'], pnlPercent: 21.7, isCurrentUser: false, depositCategory: 3 },
    { position: 4, telegramId: 4, displayName: 'Мария С.', avatarUrl: null, market: 'crypto', instruments: ['Опционы'], pnlPercent: 19.3, isCurrentUser: false, depositCategory: 1 },
    { position: 5, telegramId: 5, displayName: 'Игорь П.', avatarUrl: null, market: 'moex', instruments: ['Фьючерсы'], pnlPercent: 15.8, isCurrentUser: false, depositCategory: 2 },
    { position: 6, telegramId: 6, displayName: 'Анна Р.', avatarUrl: null, market: 'forex', instruments: ['CFD'], pnlPercent: 12.4, isCurrentUser: false, depositCategory: 3 },
    { position: 7, telegramId: 7, displayName: 'Артём Н.', avatarUrl: null, market: 'crypto', instruments: ['Спот'], pnlPercent: 10.1, isCurrentUser: false, depositCategory: 1 },
    { position: 8, telegramId: 8, displayName: 'Ольга П.', avatarUrl: null, market: 'moex', instruments: ['Акции', 'Облигации'], pnlPercent: 8.7, isCurrentUser: false, depositCategory: 2 },
    { position: 9, telegramId: 9, displayName: 'Сергей М.', avatarUrl: null, market: 'crypto', instruments: ['Фьючерсы'], pnlPercent: 5.2, isCurrentUser: false, depositCategory: 1 },
    { position: 10, telegramId: 10, displayName: 'Наталья Д.', avatarUrl: null, market: 'forex', instruments: ['Валютные пары', 'CFD'], pnlPercent: 3.1, isCurrentUser: false, depositCategory: 3 },
    { position: 11, telegramId: 11, displayName: 'Игорь Л.', avatarUrl: null, market: 'moex', instruments: ['Акции'], pnlPercent: -1.4, isCurrentUser: false, depositCategory: 2 },
    { position: 23, telegramId: 123456789, displayName: 'Вы', avatarUrl: null, market: 'crypto', instruments: ['Спот', 'Фьючерсы'], pnlPercent: 7.3, isCurrentUser: true, depositCategory: 1 },
  ],
  currentUser: { position: 23, telegramId: 123456789, displayName: 'Вы', avatarUrl: null, market: 'crypto', instruments: ['Спот', 'Фьючерсы'], pnlPercent: 7.3, isCurrentUser: true, depositCategory: 1 },
};

const mockHistory: HistoryResponse = {
  daysParticipated: 23,
  initialDeposit: 5000,
  currentDeposit: 6625,
  pnlPercent: 32.5,
  pnlAbsolute: 1625,
  currency: 'USDT',
  entries: [
    { date: '2026-02-03', dateLabel: '03.02', amount: 5000, dailyChange: null },
    { date: '2026-02-06', dateLabel: '06.02', amount: 5120, dailyChange: 2.4 },
    { date: '2026-02-09', dateLabel: '09.02', amount: 5085, dailyChange: -0.7 },
    { date: '2026-02-11', dateLabel: '11.02', amount: 5310, dailyChange: 4.4 },
    { date: '2026-02-13', dateLabel: '13.02', amount: 5580, dailyChange: 5.1 },
    { date: '2026-02-15', dateLabel: '15.02', amount: 5780, dailyChange: 3.6 },
    { date: '2026-02-17', dateLabel: '17.02', amount: 5690, dailyChange: -1.6 },
    { date: '2026-02-19', dateLabel: '19.02', amount: 6320, dailyChange: 11.1 },
    { date: '2026-02-20', dateLabel: '20.02', amount: 6245, dailyChange: -1.2 },
    { date: '2026-02-21', dateLabel: '21.02', amount: 6388, dailyChange: 2.3 },
    { date: '2026-02-22', dateLabel: '22.02', amount: 6445, dailyChange: 0.9 },
    { date: '2026-02-23', dateLabel: '23.02', amount: 6540, dailyChange: 1.5 },
    { date: '2026-02-24', dateLabel: '24.02', amount: 6490, dailyChange: -0.8 },
    { date: '2026-02-25', dateLabel: '25.02', amount: 6625, dailyChange: 2.1 },
  ],
};

// ─── API methods ──────────────────────────────────────────────────────────────

export async function getStatus(telegramId: number): Promise<UserStatus> {
  if (IS_DEV) {
    await mockDelay(800);
    return { ...mockStatus, telegramId };
  }
  // Backend now returns flat UserStatus format directly
  return request<UserStatus>('GET', `/api/user/${telegramId}/status`);
}

export async function register(payload: RegisterPayload): Promise<UserStatus> {
  if (IS_DEV) {
    await mockDelay(1200);
    const currency: Currency = payload.market === 'moex' ? 'RUB' : payload.market === 'forex' ? 'USD' : 'USDT';
    return {
      registered: true,
      depositUpdatedToday: true,
      telegramId: 123456789,
      displayName: payload.displayName,
      market: payload.market as Market,
      instruments: payload.instruments,
      initialDeposit: payload.initialDeposit,
      currency,
      avatarUrl: null,
    };
  }
  // Backend accepts camelCase directly and returns flat UserStatus
  return request<UserStatus>('POST', '/api/user/register', payload);
}

export async function getLeaderboard(category: LeaderboardCategory, telegramId?: number, signal?: AbortSignal): Promise<LeaderboardResponse> {
  if (IS_DEV) {
    await mockDelay(700);
    const currentId = telegramId ?? mockStatus.telegramId;
    const entries = mockLeaderboard.entries.map((e) => ({
      ...e,
      isCurrentUser: e.telegramId === currentId,
    }));
    const currentUser = entries.find((e) => e.isCurrentUser) ?? null;
    return { ...mockLeaderboard, category, entries, currentUser };
  }
  const userParam = telegramId != null ? `&userId=${telegramId}` : '';
  const raw = await request<LeaderboardResponse>('GET', `/api/leaderboard?category=${category}${userParam}`, undefined, signal);
  const entries = raw.entries.map((e) => ({
    ...e,
    isCurrentUser: telegramId ? e.telegramId === telegramId : false,
  }));
  // Prefer backend-computed currentUser (correct position even beyond page limit),
  // fall back to finding in loaded entries
  const currentUser = raw.currentUser ?? entries.find((e) => e.isCurrentUser) ?? null;
  return { ...raw, category, entries, currentUser };
}

export async function updateDeposit(payload: UpdateDepositPayload): Promise<void> {
  if (IS_DEV) {
    await mockDelay(800);
    return;
  }
  await request<void>('POST', '/api/deposit/update', {
    deposit_value: payload.amount,
  });
}

export async function getHistory(telegramId: number): Promise<HistoryResponse> {
  if (IS_DEV) {
    await mockDelay(700);
    return mockHistory;
  }
  // Backend returns computed HistoryResponse format
  return request<HistoryResponse>('GET', `/api/user/${telegramId}/history`);
}

export async function deleteAccount(telegramId: number): Promise<void> {
  if (IS_DEV) {
    await mockDelay(600);
    return;
  }
  await request<void>('DELETE', `/api/user/${telegramId}`);
}

export async function updateProfile(
  telegramId: number,
  displayName: string,
  avatarUrl?: string | null,
): Promise<void> {
  if (IS_DEV) {
    await mockDelay(500);
    return;
  }
  const body: Record<string, unknown> = { display_name: displayName };
  if (avatarUrl !== undefined) body.photo_url = avatarUrl;
  await request<void>('PATCH', `/api/user/${telegramId}/profile`, body);
}

/**
 * Upload a new avatar image for the user.
 * The backend compresses it to WebP 400×400 quality 85 via sharp.
 * Returns the server URL of the saved file (e.g. /uploads/123456789.webp).
 */
export async function uploadAvatar(telegramId: number, file: File): Promise<string> {
  if (IS_DEV) {
    await mockDelay(800);
    // Return an object URL as mock — works fine for local preview
    return URL.createObjectURL(file);
  }
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${BASE_URL}/api/user/${telegramId}/avatar`, {
    method: 'POST',
    headers: { 'X-Telegram-InitData': getInitData() },
    body: form,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let msg = `HTTP ${response.status}`;
    try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const { avatarUrl } = (await response.json()) as { avatarUrl: string };
  return avatarUrl;
}
