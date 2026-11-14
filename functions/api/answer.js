import { json } from "../../lib/http.js";

// Menilai jawaban di server. Setiap soal hanya bisa dijawab sekali per pemain.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Body tidak valid." }, 400);

  const playerId = String(body.playerId ?? "");
  const questionId = String(body.questionId ?? "");
  const choice = Number(body.choice); // -1 = waktu habis

  if (!playerId || !questionId || !Number.isInteger(choice) || choice < -1 || choice > 3) {
    return json({ error: "Data jawaban tidak valid." }, 400);
  }

  const question = await env.DB.prepare(
    "SELECT correct_index, points FROM questions WHERE id = ? AND is_active = 1"
  )
    .bind(questionId)
    .first();
  if (!question) return json({ error: "Soal tidak ditemukan." }, 404);

  const player = await env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!player) return json({ error: "Pemain tidak ditemukan. Silakan daftar ulang." }, 404);

  const existing = await env.DB.prepare(
    "SELECT is_correct, points FROM answers WHERE player_id = ? AND question_id = ?"
  )
    .bind(playerId, questionId)
    .first();
  if (existing) {
    return json({
      already: true,
      correct: !!existing.is_correct,
      points: existing.points,
      correct_index: question.correct_index,
    });
  }

  const isCorrect = choice === question.correct_index ? 1 : 0;
  const points = isCorrect ? question.points : 0;

  await env.DB.prepare(
    "INSERT INTO answers (player_id, question_id, choice, is_correct, points) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(playerId, questionId, choice, isCorrect, points)
    .run();

  return json({
    already: false,
    correct: !!isCorrect,
    points,
    correct_index: question.correct_index,
  });
}
