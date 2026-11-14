const $ = (sel) => document.querySelector(sel);
const STORE_KEY = "elkisai_player";

const state = {
  player: null,
  questions: [],
  index: 0,
  selected: null,
  answering: false,
  timer: null,
  timeLeft: 0,
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function show(name) {
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.id === `view-${name}`);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function api(path, options = {}) {
  const init = {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan, coba lagi.");
  return data;
}

function getStoredPlayer() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY));
  } catch {
    return null;
  }
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

/* ---------- Registrasi & mulai ---------- */

async function onRegister(e) {
  e.preventDefault();
  const errorEl = $("#register-error");
  errorEl.textContent = "";
  try {
    const player = await api("/api/players", {
      method: "POST",
      body: { name: $("#input-name").value.trim() },
    });
    localStorage.setItem(STORE_KEY, JSON.stringify({ id: player.id, name: player.name }));
    state.player = player;
    await startQuiz();
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function startQuiz() {
  try {
    state.questions = await api("/api/questions");
  } catch (err) {
    alert(err.message);
    return;
  }
  if (!state.questions.length) {
    alert("Belum ada soal yang aktif. Silakan kembali lagi nanti.");
    return;
  }
  state.index = 0;
  show("quiz");
  renderQuestion();
}

/* ---------- Kuis ---------- */

function renderQuestion() {
  const q = state.questions[state.index];
  const total = state.questions.length;

  state.selected = null;
  state.answering = false;

  $("#q-category").textContent = q.category;
  $("#q-count").textContent = `Soal ${state.index + 1} dari ${total} · ${q.points} poin`;
  $("#progress-bar").style.width = `${(state.index / total) * 100}%`;
  $("#q-text").textContent = q.question;

  const wrap = $("#options");
  wrap.replaceChildren();
  q.options.forEach((text, i) => {
    const btn = el("button", "option");
    btn.type = "button";
    btn.dataset.index = i;
    btn.append(el("span", "letter", "ABCD"[i]), el("span", "opt-text", text));
    btn.addEventListener("click", () => selectOption(i));
    wrap.append(btn);
  });

  const feedback = $("#feedback");
  feedback.textContent = "";
  feedback.className = "feedback";
  $("#btn-check").hidden = false;
  $("#btn-check").disabled = true;
  $("#btn-next").hidden = true;

  startTimer(q.time_limit);
}

function selectOption(i) {
  if (state.answering) return;
  state.selected = i;
  document.querySelectorAll(".option").forEach((btn) => {
    btn.classList.toggle("selected", Number(btn.dataset.index) === i);
  });
  $("#btn-check").disabled = false;
}

function startTimer(seconds) {
  clearInterval(state.timer);
  state.timeLeft = seconds;
  updateTimer();
  state.timer = setInterval(() => {
    state.timeLeft -= 1;
    updateTimer();
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      submitAnswer(-1);
    }
  }, 1000);
}

function updateTimer() {
  const m = String(Math.floor(state.timeLeft / 60)).padStart(2, "0");
  const s = String(state.timeLeft % 60).padStart(2, "0");
  const timer = $("#timer");
  timer.textContent = `⏱ ${m}:${s}`;
  timer.classList.toggle("warn", state.timeLeft <= 10);
}

async function submitAnswer(choice) {
  if (state.answering) return;
  state.answering = true;
  clearInterval(state.timer);

  const q = state.questions[state.index];
  const feedback = $("#feedback");
  $("#btn-check").hidden = true;

  try {
    const r = await api("/api/answer", {
      method: "POST",
      body: { playerId: state.player.id, questionId: q.id, choice },
    });
    markOptions(choice, r.correct_index);

    if (r.already) {
      feedback.textContent = "Soal ini sudah pernah kamu jawab.";
      feedback.className = "feedback";
    } else if (choice === -1) {
      feedback.textContent = "⏰ Waktu habis!";
      feedback.className = "feedback bad";
    } else if (r.correct) {
      feedback.textContent = `🎉 Benar! +${r.points} poin`;
      feedback.className = "feedback ok";
    } else {
      feedback.textContent = "Belum tepat. Perhatikan jawaban yang benar.";
      feedback.className = "feedback bad";
    }
  } catch (err) {
    feedback.textContent = err.message;
    feedback.className = "feedback bad";
    state.answering = false;
    $("#btn-check").hidden = false;
    return;
  }

  const isLast = state.index + 1 >= state.questions.length;
  $("#btn-next").textContent = isLast ? "Lihat Hasil" : "Soal Berikutnya";
  $("#btn-next").hidden = false;
}

function markOptions(choice, correctIndex) {
  document.querySelectorAll(".option").forEach((btn) => {
    const i = Number(btn.dataset.index);
    btn.disabled = true;
    if (i === correctIndex) btn.classList.add("correct");
    else if (i === choice) btn.classList.add("wrong");
  });
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= state.questions.length) return showResult();
  renderQuestion();
}

async function showResult() {
  clearInterval(state.timer);
  show("result");
  try {
    const p = await api(`/api/players?id=${encodeURIComponent(state.player.id)}`);
    $("#result-score").textContent = p.score;
    $("#result-answered").textContent = `Dijawab ${p.answered} dari ${state.questions.length} soal`;
  } catch (err) {
    $("#result-answered").textContent = err.message;
  }
}

/* ---------- Papan skor ---------- */

async function showBoard() {
  show("board");
  const podium = $("#podium");
  const list = $("#rank-list");
  const empty = $("#board-empty");
  podium.replaceChildren();
  list.replaceChildren();
  empty.hidden = true;

  try {
    const rows = await api("/api/leaderboard");
    if (!rows.length) {
      empty.textContent = "Belum ada peserta. Jadilah yang pertama!";
      empty.hidden = false;
      return;
    }

    // Susunan podium: peringkat 2 (kiri), 1 (tengah), 3 (kanan)
    [1, 0, 2]
      .filter((i) => rows[i])
      .forEach((i) => {
        const p = rows[i];
        const item = el("div", `pod pod-${i + 1}`);
        item.append(
          el("div", "avatar", initials(p.name)),
          el("div", "pod-name", p.name),
          el("div", "pod-pts", `${p.score} poin`)
        );
        podium.append(item);
      });

    rows.slice(3).forEach((p, i) => {
      const li = el("li", "rank-item");
      li.append(
        el("span", "rank-num", String(i + 4)),
        el("span", "rank-name", p.name),
        el("span", "rank-pts", `${p.score} poin`)
      );
      list.append(li);
    });
  } catch (err) {
    empty.textContent = err.message;
    empty.hidden = false;
  }
}

/* ---------- Init ---------- */

function init() {
  const stored = getStoredPlayer();
  if (stored?.id) {
    state.player = stored;
    $("#btn-start").textContent = `Lanjutkan sebagai ${stored.name}`;
    $("#btn-switch").hidden = false;
  }

  $("#btn-start").addEventListener("click", () => {
    if (state.player) startQuiz();
    else show("register");
  });
  $("#btn-switch").addEventListener("click", () => {
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });
  $("#form-register").addEventListener("submit", onRegister);
  $("#btn-check").addEventListener("click", () => {
    if (state.selected !== null) submitAnswer(state.selected);
  });
  $("#btn-next").addEventListener("click", nextQuestion);
  $("#btn-board-nav").addEventListener("click", showBoard);
  $("#btn-result-board").addEventListener("click", showBoard);
  $("#btn-board-back").addEventListener("click", () => show("splash"));

  show("splash");
}

document.addEventListener("DOMContentLoaded", init);
