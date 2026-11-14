const $ = (sel) => document.querySelector(sel);
const KEY = "elkisai_admin";
const LETTERS = "ABCD";

let password = sessionStorage.getItem(KEY) || "";
let questions = [];
let editingId = null;

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function adminApi(path, options = {}) {
  const init = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${password}`,
    },
  };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    logout();
    throw new Error("Password salah atau sesi sudah berakhir.");
  }
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
  return data;
}

function showDashboard() {
  $("#login").hidden = true;
  $("#dashboard").hidden = false;
}

function logout() {
  password = "";
  sessionStorage.removeItem(KEY);
  $("#login").hidden = false;
  $("#dashboard").hidden = true;
}

async function loadQuestions() {
  questions = await adminApi("/api/admin/questions");
  renderList();
}

/* ---------- Login ---------- */

$("#form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#login-error").textContent = "";
  password = $("#admin-pass").value;
  try {
    await loadQuestions();
    sessionStorage.setItem(KEY, password);
    showDashboard();
  } catch (err) {
    password = "";
    $("#login-error").textContent = err.message;
  }
});

/* ---------- Form ---------- */

function readForm() {
  const inputs = [0, 1, 2, 3].map((i) => $(`#f-opt-${i}`).value.trim());
  const correct = Number($("#f-correct").value);
  if (!inputs[correct]) {
    throw new Error("Jawaban benar harus dipilih dari pilihan yang sudah diisi.");
  }

  // Buang pilihan kosong, tapi jaga posisi jawaban benar.
  const options = [];
  let correct_index = -1;
  inputs.forEach((text, i) => {
    if (!text) return;
    if (i === correct) correct_index = options.length;
    options.push(text);
  });

  return {
    category: $("#f-category").value.trim() || "Umum",
    question: $("#f-question").value.trim(),
    options,
    correct_index,
    points: Number($("#f-points").value),
    time_limit: Number($("#f-time").value),
    position: Number($("#f-position").value),
    is_active: $("#f-active").checked,
  };
}

function fillForm(q) {
  $("#f-category").value = q.category;
  $("#f-question").value = q.question;
  for (let i = 0; i < 4; i++) $(`#f-opt-${i}`).value = q.options[i] ?? "";
  $("#f-correct").value = String(q.correct_index);
  $("#f-points").value = q.points;
  $("#f-time").value = q.time_limit;
  $("#f-position").value = q.position;
  $("#f-active").checked = !!q.is_active;
}

function resetForm() {
  $("#form-question").reset();
  editingId = null;
  $("#form-title").textContent = "Tambah Soal";
  $("#f-submit").textContent = "Simpan Soal";
  $("#f-cancel").hidden = true;
  $("#form-error").textContent = "";
}

function startEdit(q) {
  editingId = q.id;
  fillForm(q);
  $("#form-title").textContent = "Edit Soal";
  $("#f-submit").textContent = "Perbarui Soal";
  $("#f-cancel").hidden = false;
  $("#form-error").textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("#form-question").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#form-error").textContent = "";
  try {
    const body = readForm();
    if (editingId) {
      await adminApi(`/api/admin/questions/${editingId}`, { method: "PUT", body });
    } else {
      await adminApi("/api/admin/questions", { method: "POST", body });
    }
    resetForm();
    await loadQuestions();
  } catch (err) {
    $("#form-error").textContent = err.message;
  }
});

$("#f-cancel").addEventListener("click", resetForm);

/* ---------- Daftar soal ---------- */

function toBody(q, overrides = {}) {
  return {
    category: q.category,
    question: q.question,
    options: q.options,
    correct_index: q.correct_index,
    points: q.points,
    time_limit: q.time_limit,
    position: q.position,
    is_active: !!q.is_active,
    ...overrides,
  };
}

async function toggleActive(q) {
  try {
    await adminApi(`/api/admin/questions/${q.id}`, {
      method: "PUT",
      body: toBody(q, { is_active: !q.is_active }),
    });
    await loadQuestions();
  } catch (err) {
    alert(err.message);
  }
}

async function removeQuestion(q) {
  if (!confirm("Hapus soal ini? Tindakan tidak bisa dibatalkan.")) return;
  try {
    await adminApi(`/api/admin/questions/${q.id}`, { method: "DELETE" });
    if (editingId === q.id) resetForm();
    await loadQuestions();
  } catch (err) {
    alert(err.message);
  }
}

function renderList() {
  const list = $("#question-list");
  list.replaceChildren();
  $("#count").textContent = `${questions.length} soal`;

  if (!questions.length) {
    list.append(make("p", "muted", "Belum ada soal. Tambahkan soal pertama di form sebelah."));
    return;
  }

  questions.forEach((q, n) => {
    const item = make("article", "q-item");
    const main = make("div", "q-main");

    const meta = make("div", "q-meta");
    meta.append(
      make("span", "pill", q.category),
      make("span", "pill", `${q.points} poin`),
      make("span", "pill", `${q.time_limit} dtk`),
      make("span", q.is_active ? "pill ok" : "pill off", q.is_active ? "Aktif" : "Nonaktif")
    );

    main.append(
      meta,
      make("h3", "", `${n + 1}. ${q.question}`),
      make("p", "small muted", `Jawaban: ${LETTERS[q.correct_index]}. ${q.options[q.correct_index]}`)
    );

    const actions = make("div", "actions");
    const editBtn = make("button", "btn-ghost", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => startEdit(q));

    const toggleBtn = make("button", "btn-ghost", q.is_active ? "Nonaktifkan" : "Aktifkan");
    toggleBtn.type = "button";
    toggleBtn.addEventListener("click", () => toggleActive(q));

    const delBtn = make("button", "btn-ghost btn-danger", "Hapus");
    delBtn.type = "button";
    delBtn.addEventListener("click", () => removeQuestion(q));

    actions.append(editBtn, toggleBtn, delBtn);
    item.append(main, actions);
    list.append(item);
  });
}

/* ---------- Init ---------- */

if (password) {
  loadQuestions()
    .then(showDashboard)
    .catch(() => logout());
}
