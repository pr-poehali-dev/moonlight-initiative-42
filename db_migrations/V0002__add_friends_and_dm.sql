CREATE TABLE t_p1151301_moonlight_initiative.friends (
  id SERIAL PRIMARY KEY,
  user_nick VARCHAR(50) NOT NULL,
  friend_nick VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_nick, friend_nick)
);

CREATE TABLE t_p1151301_moonlight_initiative.dm_messages (
  id SERIAL PRIMARY KEY,
  sender VARCHAR(50) NOT NULL,
  recipient VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON t_p1151301_moonlight_initiative.dm_messages (sender, recipient);
CREATE INDEX ON t_p1151301_moonlight_initiative.dm_messages (recipient, sender);
