import { json } from "../../lib/http.js";

// Soal aktif untuk pemain. Kunci jawaban (correct_index) TIDAK dikirim.
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, category, question, options, points, time_limit
     FROM questions
     WHERE is_active = 1
     ORDER BY position, created_at`
  ).all();

  return json(
    results.map((q) => ({ ...q, options: JSON.parse(q.options) }))
  );
}
