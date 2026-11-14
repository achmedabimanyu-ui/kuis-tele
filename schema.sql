-- Pemain tamu (tanpa login). id dibuat server dan disimpan di localStorage browser.
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bank soal yang dikelola dari halaman admin.
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Umum',
  question TEXT NOT NULL,
  options TEXT NOT NULL,            -- JSON array berisi 2-4 pilihan
  correct_index INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  time_limit INTEGER NOT NULL DEFAULT 40,
  is_active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Satu jawaban per pemain per soal (mencegah pengulangan untuk menaikkan skor).
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  choice INTEGER NOT NULL,          -- -1 = waktu habis
  is_correct INTEGER NOT NULL,
  points INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (player_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_player ON answers (player_id);

-- Contoh soal awal (bisa diubah/hapus dari admin).
INSERT OR IGNORE INTO questions (id, category, question, options, correct_index, points, time_limit, position) VALUES
  ('seed-1', 'Aljabar Dasar', 'Nilai x yang memenuhi 2x + 4 < 10 adalah...', '["x < 2","x < 3","x < 4","x < 5"]', 1, 10, 40, 1),
  ('seed-2', 'Aritmetika', 'Berapa hasil dari 3 × 7?', '["19","21","24","27"]', 1, 10, 30, 2),
  ('seed-3', 'Aritmetika', 'Berapa akar kuadrat dari 144?', '["10","11","12","14"]', 2, 10, 30, 3),
  ('seed-4', 'Aljabar Dasar', 'Hasil dari (x + 2)(x − 2) adalah...', '["x² − 4","x² + 4","x² − 2x","x² + 2x"]', 0, 10, 40, 4);
