import { json } from "../../lib/http.js";

// Daftarkan tamu baru tanpa login. Nama + id disimpan di database.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Body tidak valid." }, 400);

  const name = String(body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  if (name.length < 2) return json({ error: "Nama minimal 2 karakter." }, 400);

  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO players (id, name) VALUES (?, ?)")
    .bind(id, name)
    .run();

  return json({ id, name }, 201);
}

// Ambil data pemain + total skor (dipakai saat melanjutkan sesi).
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const row = await env.DB.prepare(
    `SELECT p.id, p.name,
            COALESCE(SUM(a.points), 0) AS score,
            COUNT(a.id) AS answered
     FROM players p
     LEFT JOIN answers a ON a.player_id = p.id
     WHERE p.id = ?
     GROUP BY p.id`
  )
    .bind(id)
    .first();

  if (!row) return json({ error: "Pemain tidak ditemukan." }, 404);
  return json(row);
}
