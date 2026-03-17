# Punto de entrada: configura e inicia el servidor HTTP

import sys
from http.server import HTTPServer

from models.chain import TaskChain
from server.handler import AppHandler


def seed_initial_tasks(chain: TaskChain):
    """Carga tareas de ejemplo al iniciar la aplicación."""
    chain.append_task(
        "Estudiar estructuras de datos",
        "alta",
        "Revisar listas enlazadas y árboles binarios"
    )
    chain.append_task(
        "Hacer ejercicio",
        "media",
        "Correr 30 minutos en el parque"
    )
    chain.append_task(
        "Comprar ingredientes",
        "baja",
        "Leche, huevos, pan y frutas"
    )


def main():
    port = 8080

    # Crear la lista enlazada e inyectarla en el handler
    chain = TaskChain()
    seed_initial_tasks(chain)

    AppHandler.task_chain = chain

    server = HTTPServer(("0.0.0.0", port), AppHandler)
    print(f"Servidor corriendo en http://localhost:{port}")
    print("Presiona Ctrl+C para detenerlo.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        server.server_close()
        sys.exit(0)


if __name__ == "__main__":
    main()
