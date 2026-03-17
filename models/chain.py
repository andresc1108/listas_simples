# Clase que gestiona la lista enlazada simple de tareas

from models.node import TaskNode


class TaskChain:
    def __init__(self):
        self.anchor = None    # Primer nodo de la cadena (cabeza de la lista)
        self.volume = 0       # Cantidad total de nodos en la cadena

    def append_task(self, label: str, urgency: str, summary: str) -> TaskNode:
        """Agrega una nueva tarea al final de la lista enlazada."""
        fresh_node = TaskNode(label, urgency, summary)

        if self.anchor is None:
            # La lista está vacía: el nuevo nodo se convierte en la cabeza
            self.anchor = fresh_node
        else:
            # Recorrer hasta el último nodo y enlazar el nuevo
            cursor = self.anchor
            while cursor.successor is not None:
                cursor = cursor.successor
            cursor.successor = fresh_node

        self.volume += 1
        return fresh_node

    def fetch_all(self) -> list:
        """Recorre la cadena completa y retorna todas las tareas como lista de diccionarios."""
        roster = []
        index = 0
        cursor = self.anchor

        while cursor is not None:
            roster.append({
                "position": index,
                "label": cursor.label,
                "urgency": cursor.urgency,
                "summary": cursor.summary
            })
            cursor = cursor.successor
            index += 1

        return roster

    def mark_done(self, position: int) -> bool:
        """Marca como completada la tarea ubicada en la posición indicada."""
        cursor = self.anchor
        idx = 0

        while cursor is not None:
            if idx == position:
                if not cursor.label.startswith("[✓] "):
                    cursor.label = "[✓] " + cursor.label
                return True
            cursor = cursor.successor
            idx += 1

        return False

    def count(self) -> int:
        """Retorna el número total de nodos en la cadena."""
        return self.volume
