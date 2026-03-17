# Clase que representa un nodo dentro de la lista enlazada


class TaskNode:
    def __init__(self, label: str, urgency: str, summary: str):
        self.label = label        # Nombre de la tarea
        self.urgency = urgency    # Prioridad: alta, media, baja
        self.summary = summary    # Descripción breve
        self.successor = None     # Referencia al siguiente nodo en la cadena
