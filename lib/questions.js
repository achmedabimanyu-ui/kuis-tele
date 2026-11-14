/**
 * Validates and normalizes question input from the admin panel.
 * Returns { value } on success or { error } on failure.
 */
export function validateQuestion(body) {
  const question = String(body.question ?? "").trim();
  const options = Array.isArray(body.options)
    ? body.options.map((o) => String(o).trim())
    : [];
  const correct_index = Number(body.correct_index);
  const points = Number(body.points ?? 10);
  const time_limit = Number(body.time_limit ?? 40);
  const position = Number(body.position ?? 0);
  const category = String(body.category ?? "").trim().slice(0, 40) || "Umum";
  const is_active = body.is_active === false || body.is_active === 0 ? 0 : 1;

  if (!question || question.length > 500) {
    return { error: "Pertanyaan wajib diisi (maks. 500 karakter)." };
  }
  if (options.length < 2 || options.length > 4 || options.some((o) => !o)) {
    return { error: "Pilihan jawaban harus 2–4 dan tidak boleh kosong." };
  }
  if (!Number.isInteger(correct_index) || correct_index < 0 || correct_index >= options.length) {
    return { error: "Jawaban benar tidak valid." };
  }
  if (!Number.isInteger(points) || points < 1 || points > 100) {
    return { error: "Poin harus antara 1 dan 100." };
  }
  if (!Number.isInteger(time_limit) || time_limit < 5 || time_limit > 300) {
    return { error: "Waktu harus antara 5 dan 300 detik." };
  }
  if (!Number.isInteger(position) || position < 0) {
    return { error: "Urutan harus berupa angka 0 atau lebih." };
  }

  return {
    value: {
      category,
      question,
      options: JSON.stringify(options),
      correct_index,
      points,
      time_limit,
      position,
      is_active,
    },
  };
}
