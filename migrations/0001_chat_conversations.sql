PRAGMA foreign_keys = ON;

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  delete_token_hash TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  last_message_at INTEGER NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  browser TEXT,
  operating_system TEXT,
  device TEXT,
  user_agent TEXT,
  last_status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX conversations_by_last_message
  ON conversations(last_message_at DESC);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'complete',
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX messages_by_conversation
  ON messages(conversation_id, created_at ASC);
