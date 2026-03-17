// Lógica del cliente: consume la API REST y actualiza la interfaz

const API_BASE = "";

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

  // Calcular estadísticas
  let doneCount = 0;
  tasks.forEach(t => { if (t.label.startsWith("[✓]")) doneCount++; });

  document.getElementById("stat-total").textContent = tasks.length;
  document.getElementById("stat-done").textContent  = doneCount;
  document.getElementById("stat-pend").textContent  = tasks.length - doneCount;

  // Estado vacío
  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        No hay tareas aún. ¡Agrega la primera!
      </div>`;
    return;
  }

  // Tarjeta por cada nodo de la lista enlazada
  tasks.forEach((t) => {
    const isDone     = t.label.startsWith("[✓]");
    const cleanLabel = t.label.replace("[✓] ", "");

    const card = document.createElement("div");
    card.className = "task-card" + (isDone ? " done" : "");

    card.innerHTML = `
      <span class="task-index">#${t.position + 1}</span>
      <div class="task-body">
        <div class="task-label">${escHtml(cleanLabel)}</div>
        ${t.summary
          ? `<div class="task-summary">${escHtml(t.summary)}</div>`
          : ""}
        <div class="task-meta">
          <span class="urgency-badge urgency-${t.urgency}">${t.urgency}</span>
        </div>
      </div>
      <button
        class="btn-done"
        data-pos="${t.position}"
        ${isDone ? "disabled" : ""}
      >${isDone ? "✓ Hecha" : "Completar"}</button>
    `;

    // Evento del botón completar
    if (!isDone) {
      card.querySelector(".btn-done").addEventListener("click", () => {
        completeTask(t.position);
      });
    }

    list.appendChild(card);
  });
}

// ── Envía al servidor la solicitud de agregar nueva tarea ─────────────────────
async function addTask() {
  const label   = document.getElementById("inp-label").value.trim();
  const urgency = document.getElementById("inp-urgency").value;
  const summary = document.getElementById("inp-summary").value.trim();

  if (!label) {
    showToast("Escribe el nombre de la tarea.", "error");
    return;
  }

  try {
    const res  = await fetch(API_BASE + "/api/tasks/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, urgency, summary })
    });
    const data = await res.json();

    if (data.ok) {
      // Limpiar formulario
      document.getElementById("inp-label").value   = "";
      document.getElementById("inp-summary").value = "";
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
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();

  // Agregar con botón
  document.getElementById("btn-submit").addEventListener("click", addTask);

  // Agregar con Enter desde el campo de nombre
  document.getElementById("inp-label").addEventListener("keydown", e => {
    if (e.key === "Enter") addTask();
  });
});
