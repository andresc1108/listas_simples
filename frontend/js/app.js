// Lógica del cliente: selector SVG de prioridad, API REST y renderizado

const API_BASE = "";

// ── SVG inline por prioridad (se inyecta en cada tarjeta) ─────────────────────
const PRIORITY_ICONS = {
  alta: `
    <svg class="task-priority-icon alta" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Prioridad alta">
      <path d="M14 3C14 3 9 8.5 9 13.5C9 16.5 10.5 18.5 12 19.5C11.5 17.5 13 15.5 13 15.5C13 15.5 13.5 19 16 20.5C17.5 19.5 19 17.5 19 14.5C19 11 16 7 14 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="14" cy="21.5" r="2" stroke="currentColor" stroke-width="1.6"/>
    </svg>`,
  media: `
    <svg class="task-priority-icon media" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Prioridad media">
      <circle cx="14" cy="14" r="9" stroke="currentColor" stroke-width="1.6"/>
      <path d="M14 9V14L17 16.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  baja: `
    <svg class="task-priority-icon baja" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Prioridad baja">
      <path d="M7 21C7 21 8 13 14 10C20 7 22 8 22 8C22 8 21 14 16 17C13 19 10 19.5 7 21Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M7 21L12 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`
};

const ICON_CHECK = `
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const ICON_EMPTY = `
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="30" rx="4" stroke="currentColor" stroke-width="2"/>
    <path d="M16 10V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="2"/>
    <path d="M16 22h16M16 29h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

// ── Inicializa el selector SVG de prioridad ───────────────────────────────────
function initPrioritySelector() {
  const nativeSelect = document.getElementById("inp-urgency");
  const buttons      = document.querySelectorAll(".priority-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      nativeSelect.value = btn.dataset.value;
    });
  });
}

// ── Carga y renderiza todas las tareas desde el servidor ──────────────────────
async function loadTasks() {
  try {
    const res  = await fetch(API_BASE + "/api/tasks");
    const data = await res.json();
    renderTasks(data.tasks);
  } catch {
    showToast("No se pudo conectar con el servidor.", "error");
  }
}

// ── Construye y muestra las tarjetas de tarea en el DOM ───────────────────────
function renderTasks(tasks) {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  let doneCount = 0;
  tasks.forEach(t => { if (t.label.startsWith("[✓]")) doneCount++; });
  document.getElementById("stat-total").textContent = tasks.length;
  document.getElementById("stat-done").textContent  = doneCount;
  document.getElementById("stat-pend").textContent  = tasks.length - doneCount;

  if (tasks.length === 0) {
    list.innerHTML = `<div class="empty-state">${ICON_EMPTY}No hay tareas aún. ¡Agrega la primera!</div>`;
    return;
  }

  tasks.forEach(t => {
    const isDone     = t.label.startsWith("[✓]");
    const cleanLabel = t.label.replace("[✓] ", "");
    const icon       = PRIORITY_ICONS[t.urgency] || PRIORITY_ICONS.media;

    const card = document.createElement("div");
    card.className = "task-card" + (isDone ? " done" : "");
    card.innerHTML = `
      <span class="task-index">#${t.position + 1}</span>
      ${icon}
      <div class="task-body">
        <div class="task-label">${escHtml(cleanLabel)}</div>
        ${t.summary ? `<div class="task-summary">${escHtml(t.summary)}</div>` : ""}
        <div class="task-meta">
          <span class="urgency-badge urgency-${t.urgency}">${t.urgency}</span>
        </div>
      </div>
      <button class="btn-done" data-pos="${t.position}" ${isDone ? "disabled" : ""}>
        ${ICON_CHECK} ${isDone ? "Hecha" : "Completar"}
      </button>`;

    if (!isDone) {
      card.querySelector(".btn-done").addEventListener("click", () => completeTask(t.position));
    }
    list.appendChild(card);
  });
}

// ── Envía al servidor la solicitud de agregar nueva tarea ─────────────────────
async function addTask() {
  const label   = document.getElementById("inp-label").value.trim();
  const urgency = document.getElementById("inp-urgency").value;
  const summary = document.getElementById("inp-summary").value.trim();

  if (!label) { showToast("Escribe el nombre de la tarea.", "error"); return; }

  try {
    const res  = await fetch(API_BASE + "/api/tasks/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, urgency, summary })
    });
    const data = await res.json();

    if (data.ok) {
      document.getElementById("inp-label").value   = "";
      document.getElementById("inp-summary").value = "";
      document.querySelectorAll(".priority-btn").forEach(b => {
        const isMedia = b.dataset.value === "media";
        b.classList.toggle("active", isMedia);
        b.setAttribute("aria-pressed", isMedia ? "true" : "false");
      });
      document.getElementById("inp-urgency").value = "media";
      showToast(data.msg, "success");
      loadTasks();
    } else {
      showToast(data.msg, "error");
    }
  } catch {
    showToast("Error al conectar con el servidor.", "error");
  }
}

// ── Envía al servidor la solicitud de marcar una tarea como completada ─────────
async function completeTask(position) {
  try {
    const res  = await fetch(API_BASE + "/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position })
    });
    const data = await res.json();
    showToast(data.msg, data.ok ? "success" : "error");
    if (data.ok) loadTasks();
  } catch {
    showToast("Error al conectar con el servidor.", "error");
  }
}

// ── Muestra una notificación temporal en la esquina ───────────────────────────
function showToast(msg, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className   = "visible " + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = ""; }, 3000);
}

// ── Escapa caracteres HTML para evitar XSS ────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initPrioritySelector();
  loadTasks();
  document.getElementById("btn-submit").addEventListener("click", addTask);
  document.getElementById("inp-label").addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
});