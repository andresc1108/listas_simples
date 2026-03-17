# Manejador de peticiones HTTP: expone la API REST y sirve el frontend

import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse


class AppHandler(BaseHTTPRequestHandler):

    # Referencia a la instancia de TaskChain inyectada desde main.py
    task_chain = None

    def log_message(self, format, *args):
        pass  # Silencia los logs del servidor en la consola

    # ── Helpers ──────────────────────────────────────────────────────────────

    def send_json(self, payload: dict, status: int = 200):
        """Serializa y envía una respuesta JSON con los headers correspondientes."""
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, filepath: str, mime: str):
        """Lee y sirve un archivo estático del sistema de archivos."""
        if not os.path.isfile(filepath):
            self.send_json({"error": "Archivo no encontrado"}, 404)
            return
        with open(filepath, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    # ── GET ───────────────────────────────────────────────────────────────────

    def do_GET(self):
        parsed = urlparse(self.path)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        if parsed.path == "/api/tasks":
            # Retorna todas las tareas almacenadas en la lista enlazada
            self.send_json({
                "tasks": self.task_chain.fetch_all(),
                "total": self.task_chain.count()
            })

        elif parsed.path in ("/", "/index.html"):
            self.serve_static(
                os.path.join(base_dir, "frontend", "index.html"),
                "text/html; charset=utf-8"
            )

        elif parsed.path == "/frontend/css/styles.css":
            self.serve_static(
                os.path.join(base_dir, "frontend", "css", "styles.css"),
                "text/css; charset=utf-8"
            )

        elif parsed.path == "/frontend/js/app.js":
            self.serve_static(
                os.path.join(base_dir, "frontend", "js", "app.js"),
                "application/javascript; charset=utf-8"
            )

        else:
            self.send_json({"error": "Ruta no encontrada"}, 404)

    # ── POST ──────────────────────────────────────────────────────────────────

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)

        if parsed.path == "/api/tasks/add":
            self._handle_add(raw)

        elif parsed.path == "/api/tasks/complete":
            self._handle_complete(raw)

        else:
            self.send_json({"error": "Ruta no encontrada"}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    # ── Handlers internos ─────────────────────────────────────────────────────

    def _handle_add(self, raw: bytes):
        """Procesa la creación de una nueva tarea en la lista."""
        try:
            payload = json.loads(raw)
            lbl = payload.get("label", "").strip()
            urg = payload.get("urgency", "media").strip()
            smr = payload.get("summary", "").strip()

            if not lbl:
                self.send_json({"ok": False, "msg": "El nombre de la tarea es obligatorio."}, 400)
                return

            if urg not in ("alta", "media", "baja"):
                urg = "media"

            node = self.task_chain.append_task(lbl, urg, smr)
            self.send_json({
                "ok": True,
                "msg": "Tarea agregada correctamente.",
                "task": {
                    "label": node.label,
                    "urgency": node.urgency,
                    "summary": node.summary
                }
            })
        except Exception:
            self.send_json({"ok": False, "msg": "Datos inválidos."}, 400)

    def _handle_complete(self, raw: bytes):
        """Marca la tarea indicada por posición como completada."""
        try:
            payload = json.loads(raw)
            pos = int(payload.get("position", -1))
            success = self.task_chain.mark_done(pos)

            if success:
                self.send_json({"ok": True, "msg": "Tarea marcada como completada."})
            else:
                self.send_json({"ok": False, "msg": "Posición no válida."}, 400)
        except Exception:
            self.send_json({"ok": False, "msg": "Datos inválidos."}, 400)
