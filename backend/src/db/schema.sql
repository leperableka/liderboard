CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(64),
  display_name VARCHAR(128) NOT NULL,
  photo_url TEXT,
  market VARCHAR(10) NOT NULL CHECK (market IN ('crypto', 'moex', 'forex')),
  instruments JSONB NOT NULL DEFAULT '[]',
  initial_deposit DECIMAL(18,2) NOT NULL,
  currency VARCHAR(4) NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  consented_pd BOOLEAN NOT NULL DEFAULT FALSE,
  consented_rules BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS deposit_updates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_date DATE NOT NULL,
  deposit_value DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, deposit_date)
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_market ON users(market);
CREATE INDEX IF NOT EXISTS idx_deposit_updates_user_date ON deposit_updates(user_id, deposit_date);
CREATE INDEX IF NOT EXISTS idx_deposit_updates_date ON deposit_updates(deposit_date);
