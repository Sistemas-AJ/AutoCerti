function inicializarAtajos(canvas, { undo, redo, deleteSelected, saveTemplate }) {
  let clipboard = null;

  const copyObject = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone(cloned => {
        clipboard = cloned;
      });
    }
  };

  const pasteObject = () => {
    if (!clipboard) return;

    clipboard.clone(clonedObj => {
      canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 15,
        top: clonedObj.top + 15,
        evented: true,
      });
      // Si es una selección múltiple, los trata individualmente
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        clonedObj.forEachObject(obj => canvas.add(obj));
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      // Actualiza la posición para el siguiente pegado
      clipboard.top += 15;
      clipboard.left += 15;
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    });
  };

  document.addEventListener('keydown', (e) => {
    // Si el usuario está escribiendo en un campo (ej. la barra de herramientas), no activar los atajos
    const activeElement = document.activeElement.tagName;
    if (activeElement === 'INPUT' || activeElement === 'TEXTAREA') {
        // Excepción para permitir deshacer/rehacer incluso desde un input
        if (e.ctrlKey && (e.key === 'z' || e.key === 'y')) {
            // No hacer nada para que se ejecute la lógica de abajo
        } else {
            return; // Salir para permitir escribir normalmente
        }
    }
    
    // Si se está editando un texto en el lienzo, no activar los atajos (excepto CTRL+S)
    if (canvas.getActiveObject() && canvas.getActiveObject().isEditing && !(e.ctrlKey && e.key === 's')) {
      return;
    }

    // Gestionar atajos
    if (e.ctrlKey) {
      e.preventDefault(); // Prevenir acciones por defecto del navegador (como guardar página)
      switch (e.key.toLowerCase()) {
        case 'z': undo(); break;
        case 'y': redo(); break;
        case 'c': copyObject(); break;
        case 'v': pasteObject(); break;
        case 's': saveTemplate(); break;
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
    }
  });
  window.addEventListener('beforeunload', (event) => {
    // Compara el índice actual del historial con el último índice guardado.
    if (historyIndex !== savedHistoryIndex) {
      // Mensaje estándar que mostrarán los navegadores.
      const confirmationMessage = 'Hay cambios sin guardar. ¿Estás seguro de que quieres salir?';

      // Previene la acción por defecto para mostrar la alerta.
      event.preventDefault();
      // Requerido por algunos navegadores más antiguos.
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });

  console.log("✅ Atajos de teclado inicializados.");
}