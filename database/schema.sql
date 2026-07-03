-- ============================================================
-- Omnichannel CRM - Database Schema for Supabase (PostgreSQL)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'telegram', 'messenger')),
  platform_id   TEXT NOT NULL,  -- phone number / platform user ID
  name          TEXT,
  avatar_url    TEXT,
  language      TEXT DEFAULT 'ar',
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each platform user should appear only once per platform
  UNIQUE (platform, platform_id)
);

-- Index for fast subscription filtering + lookups
CREATE INDEX idx_customers_platform ON customers(platform);
CREATE INDEX idx_customers_subscribed ON customers(is_subscribed) WHERE is_subscribed = TRUE;
CREATE INDEX idx_customers_platform_platform_id ON customers(platform, platform_id);


-- ============================================================
-- 2. CHATS TABLE
-- ============================================================
CREATE TABLE chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'telegram', 'messenger')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chats_customer ON chats(customer_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);


-- ============================================================
-- 3. MESSAGES TABLE
-- ============================================================
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'telegram', 'messenger')),
  direction     TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type  TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'template', 'interactive')),
  content       TEXT,
  media_url     TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_customer ON messages(customer_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_platform ON messages(platform);


-- ============================================================
-- 4. TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 5. TRIGGER: update last_message_on on new message
-- ============================================================
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_update_chat
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();


-- ============================================================
-- 6. ENABLE REALTIME (for Supabase Realtime)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
