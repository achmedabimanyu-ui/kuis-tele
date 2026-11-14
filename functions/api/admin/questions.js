import { json } from "../../../lib/http.js";
import { requireAdmin } from "../../../lib/auth.js";
import { validateQuestion } from "../../../lib/questions.js";

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const { results } = await env.DB.prepare(
    "SELECT * FROM questions ORDER BY position, created_at"
  ).all();

  return json(results.map((q) => ({ ...q, options: JSON.parse(q.options) })));
}

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Body tidak valid." }, 400);

  const { value, error } = validateQuestion(body);
  if (error) return json({ error }, 400);

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO questions
       (id, category, question, options, correct_index, points, time_limit, position, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      value.category,
      value.question,
      value.options,
      value.correct_index,
      value.points,
      value.time_limit,
      value.position,
      value.is_active
    )
    .run();

  return json({ id }, 201);
}
