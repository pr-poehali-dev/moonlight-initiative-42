CREATE TABLE t_p1151301_moonlight_initiative.chat_users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(50) UNIQUE NOT NULL,
  last_seen TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p1151301_moonlight_initiative.chat_messages (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
