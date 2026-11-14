import { json } from "../../../../lib/http.js";
import { requireAdmin } from "../../../../lib/auth.js";
import { validateQuestion } from "../../../../lib/questions.js";

export async function onRequestPut({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Body tidak valid." }, 400);

  const { value, error } = validateQuestion(body);
  if (error) return json({ error }, 400);

  const res = await env.DB.prepare(
    `UPDATE questions
     SET category = ?, question = ?, options = ?, correct_index = ?,
         points = ?, time_limit = ?, position = ?, is_active = ?
     WHERE id = ?`
  )
    .bind(
      value.category,
      value.question,
      value.options,
      value.correct_index,
      value.points,
      value.time_limit,
      value.position,
      value.is_active,
      params.id
    )
    .run();

  if (!res.meta.changes) return json({ error: "Soal tidak ditemukan." }, 404);
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  // Soal yang sudah dijawab tidak dihapus agar skor pemain tidak rusak.
  const used = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM answers WHERE question_id = ?"
  )
    .bind(params.id)
    .first();
  if (used.n > 0) {
    return json(
      { error: "Soal sudah pernah dijawab. Nonaktifkan saja agar skor tidak hilang." },
      409
    );
  }

  const res = await env.DB.prepare("DELETE FROM questions WHERE id = ?")
    .bind(params.id)
    .run();
  if (!res.meta.changes) return json({ error: "Soal tidak ditemukan." }, 404);
  return json({ ok: true });
}
