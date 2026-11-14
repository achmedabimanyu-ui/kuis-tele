import { json } from "../../lib/http.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name,
            COALESCE(SUM(a.points), 0) AS score,
            COUNT(a.id) AS answered
     FROM players p
     INNER JOIN answers a ON a.player_id = p.id
     GROUP BY p.id
     ORDER BY score DESC, answered DESC, p.created_at ASC
     LIMIT 50`
  ).all();

  return json(results);
}
