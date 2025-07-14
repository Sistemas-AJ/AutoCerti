const canvas = new fabric.Canvas('canvas');
let dataRows = [];
let zip = new JSZip();
let fileNameCounts = {};

let history = [];
let historyIndex = -1;
let savedHistoryIndex = -1; 
let historyLock = false;

function loadExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  // Ejemplo: utilizar XLSX para leer el archivo
  const reader = new FileReader();
  reader.onload = function(e) {
    // Procesa el contenido del Excel...
    alert("Excel cargado: " + file.name);
  };
  reader.readAsBinaryString(file);
}

// Función para agregar un cuadro de texto con marcador de posición
function addText() {
    const text = new fabric.Textbox('Ingrese texto...', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#000000',
      textAlign: 'left',
      fontFamily: 'Arial',
      width: 300  // Define un ancho fijo para que se haga wrapping en lugar de estirarse.
    });
    canvas.add(text);
}


// guardar el estado en una serie de lista
function saveState() {
  if (historyLock) return; // Si está bloqueado, no guardamos el estado

  // Elimina los estados futuros si hemos deshecho y luego hacemos un nuevo cambio
  history = history.slice(0, historyIndex + 1);
  
  // Añade el nuevo estado (como un objeto JSON)
  history.push(JSON.stringify(canvas.toJSON()));
  historyIndex = history.length - 1;
}

// Función para activar el input de imágenes
function triggerImageUpload() {
  document.getElementById('input-image').click();
}

function loadTemplate(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const json = e.target.result;
      canvas.loadFromJSON(json, function() {
        canvas.renderAll();
        history = [];
        historyIndex = -1;
        savedHistoryIndex = -1;

      });
    };
    reader.readAsText(file);
  }

// Manejo de la carga de imagen
document.getElementById('input-image').addEventListener('change', function(event) {
  let file = event.target.files[0];
  if (!file) return;
  let reader = new FileReader();
  reader.onload = function(e) {
    fabric.Image.fromURL(e.target.result, function(img) {
      img.set({
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5
      });
      canvas.add(img);
    });
  };
  reader.readAsDataURL(file);
});

function loadExcel(event) {
  let file = event.target.files[0];
  if (!file) return;
  let reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = function(e) {
    let data = e.target.result;
    let workbook = XLSX.read(data, { type: 'binary' });
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    dataRows = XLSX.utils.sheet_to_json(sheet);
    alert('Datos de Excel cargados.');
    populateColumnsMenu();
  }
}



// Mostrar/ocultar y actualizar la barra de herramientas flotante según la selección
canvas.on('selection:created', updateFloatingToolbar);
canvas.on('selection:updated', updateFloatingToolbar);
canvas.on('selection:cleared', function() {
  document.getElementById("floating-toolbar").style.display = "none";
});





function updateFloatingToolbar() {
  let activeObject = canvas.getActiveObject();
  if (activeObject) {
    // Mostrar la barra flotante
    document.getElementById("floating-toolbar").style.display = "block";
    // Si es un objeto de texto, mostrar y actualizar los controles de texto
    if (activeObject.type === 'textbox' || activeObject.type === 'i-text' || activeObject.type === 'text') {
      document.getElementById("text-controls").style.display = "block";
      document.getElementById("text-align").value = activeObject.textAlign || "left";
      document.getElementById("text-color").value = activeObject.fill || "#000000";
      document.getElementById("font-family").value = activeObject.fontFamily || "Arial";
      document.getElementById("font-size").value = activeObject.fontSize || 30;
      document.getElementById("text-bold").checked = (activeObject.fontWeight === 'bold');
      document.getElementById("text-italic").checked = (activeObject.fontStyle === 'italic');
      // Evitamos múltiples adjuntos comprobando una bandera
      if (!activeObject.previewListenerAttached) {
        activeObject.on('changed', debouncedGeneratePreview);
        activeObject.previewListenerAttached = true;
      }
    } else {
      // Si no es texto, ocultamos los controles de texto
      document.getElementById("text-controls").style.display = "none";
    }
  }
}

// Hacer la barra de herramientas flotante movible
dragElement(document.getElementById("floating-toolbar"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "-header")) {
    // Si hay un encabezado, lo usamos como el área de arrastre
    document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
  } else {
    // De lo contrario, el área de arrastre es el propio elemento
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Obtener la posición del cursor al inicio del arrastre
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Llamar a la función cada vez que el cursor se mueva
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calcular la nueva posición del cursor
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Establecer la nueva posición del elemento
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // Detener el movimiento cuando se suelta el botón del mouse
    document.onmouseup = null;
    document.onmousemove = null;
  }
}



// Actualización de propiedades de texto a partir de los controles
document.getElementById("text-align").addEventListener("change", function() {
  let activeObject = canvas.getActiveObject();
  if (activeObject) {
    if (activeObject.isEditing) {
        activeObject.setSelectionStyles("textAlign", this.value);
        
    } else{
        activeObject.set("textAlign", this.value);
    }
    canvas.renderAll();
  }
});
document.getElementById("text-color").addEventListener("change", function() {
    let activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.isEditing) {
        activeObject.setSelectionStyles({ fill: this.value });
      } else {
        activeObject.set("fill", this.value);
      }
      canvas.renderAll();
    }
  });
document.getElementById("font-family").addEventListener("change", function() {
  let activeObject = canvas.getActiveObject();
  if (activeObject) {
    if (activeObject.isEditing) {
      activeObject.setSelectionStyles({ fontFamily: this.value });
    } else {
      activeObject.set("fontFamily", this.value);
    }
    canvas.renderAll();
  }
});
document.getElementById("font-size").addEventListener("change", function() {
  let activeObject = canvas.getActiveObject();
  const newSize = parseInt(this.value, 10);
  if (activeObject) {
    if (activeObject.isEditing) {
      activeObject.setSelectionStyles({ fontSize: newSize });
    } else {
      activeObject.set("fontSize", newSize);
    }
    canvas.renderAll();
  }
});
document.getElementById("text-bold").addEventListener("change", function() {
  let activeObject = canvas.getActiveObject();
  if (activeObject) {
    if (activeObject.isEditing) {
      // Aplica a la selección
      activeObject.setSelectionStyles({ fontWeight: this.checked ? "bold" : "normal" });
    } else {
      // Aplica al objeto completo
      activeObject.set("fontWeight", this.checked ? "bold" : "normal");
    }
    canvas.renderAll();
  }
});
document.getElementById("text-italic").addEventListener("change", function() {
  let activeObject = canvas.getActiveObject();
  if (activeObject) {
    if (activeObject.isEditing) {
      activeObject.setSelectionStyles({ fontStyle: this.checked ? "italic" : "normal" });
    } else {
      activeObject.set("fontStyle", this.checked ? "italic" : "normal");
    }
    canvas.renderAll();
  }
});

// Controles de capas: traer al frente y enviar al fondo
document.getElementById("bring-to-front").addEventListener("click", function() {
  let activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.bringToFront();
    canvas.renderAll();
  }
});
document.getElementById("send-to-back").addEventListener("click", function() {
  let activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.sendToBack();
    canvas.renderAll();
  }
});


// Evento para insertar el marcador en el texto activo
document.getElementById("columns-menu").addEventListener("change", function() {
  const col = this.value;
  if (!col) return;
  const placeholder = `{{${col}}}`;
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.isEditing) {
    const cursorPos = activeObject.selectionStart || 0;
    const currentText = activeObject.text;
    const newText = currentText.slice(0, cursorPos) + placeholder + currentText.slice(cursorPos);
    activeObject.text = newText;
    activeObject.selectionStart = activeObject.selectionEnd = cursorPos + placeholder.length;
    canvas.renderAll();
  } else {
    addText();
    const newObj = canvas.getActiveObject();
    if (newObj) {
      newObj.text = placeholder;
      newObj.enterEditing();
      canvas.renderAll();
    }
  }
  this.value = "";
});

// Funciones para mostrar/actualizar/ocultar el área de progreso
function showProgress(phase) {
  const container = document.getElementById("progress-container");
  const label = document.getElementById("progress-label");
  container.style.display = "block";
  if (phase === "qr") {
    label.innerText = "Generando códigos QR";
  } else if (phase === "pdf") {
    label.innerText = "Generando PDFs";
  }
  updateProgress(0, 1); // Inicializa en 0%
}

function updateProgress(current, total) {
  const progressBar = document.getElementById("progress-bar");
  const progressPercent = document.getElementById("progress-percent");
  const percent = Math.floor((current / total) * 100);
  progressBar.value = percent;
  progressPercent.innerText = percent + "%";
}

function hideProgress() {
  const container = document.getElementById("progress-container");
  container.style.display = "none";
}


function generateCertificates() {
  zip = new JSZip();
  const totalCertificates = dataRows.length;
  let qrProcessed = 0;
  let pdfProcessed = 0;
  let errorsCount = 0;
  const processedCertificates = []; // Almacena { canvas, row } de cada certificado procesado

  // Fase 1: Generar códigos QR
  showProgress("qr");
  let qrPromises = dataRows.map((row, index) => {
    return new Promise((resolve) => {
      // Clonar el canvas original
      let clonedCanvas = new fabric.Canvas(null, { width: 1123, height: 794 });
      clonedCanvas.loadFromJSON(canvas.toJSON(), function() {
        // Reemplazar marcadores de texto (excepto el QR)
        clonedCanvas.getObjects().forEach(obj => {
          if ((obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') && !obj.text.includes('{{qr}}')) {
            Object.keys(row).forEach(key => {
              replaceTextWithStyles(obj, `{{${key}}}`, row[key] || '');
            });
          }
        });

        // Procesar objetos que contienen el marcador {{qr}}
        let rowQrPromises = [];
        clonedCanvas.getObjects().forEach(obj => {
          if ((obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') && obj.text.includes('{{qr}}')) {
            let p = new Promise((resolveRow) => {
              let qrData = row['qr'] || row['QR'] || row['Qr'];
              if (!qrData || qrData.toString().trim() === "") {
                console.error("No se proporcionó información válida para el QR en la fila:", row);
                return resolveRow();
              }
              let fontSize = obj.fontSize || 30;
              let qrWidth = fontSize * 5;
              // Usando QRCode.toCanvas de QRCode.js para generar el QR
              QRCode.toCanvas(qrData, { width: qrWidth, margin: 2 }, function(err, canvasQR) {
                if (err) {
                  console.error("Error generando QR:", err);
                  resolveRow();
                } else {
                  const url = canvasQR.toDataURL();
                  fabric.Image.fromURL(url, function(img) {
                    img.set({
                      left: obj.left,
                      top: obj.top,
                      angle: obj.angle,
                      scaleX: 1,
                      scaleY: 1
                    });
                    clonedCanvas.remove(obj);
                    clonedCanvas.add(img);
                    resolveRow();
                  });
                }
              });
            });
            rowQrPromises.push(p);
          }
        });
        Promise.all(rowQrPromises).then(() => {
          clonedCanvas.renderAll();
          qrProcessed++;
          updateProgress(qrProcessed, totalCertificates);
          processedCertificates.push({ canvas: clonedCanvas, row: row });
          resolve();
        });
      });
    });
  });

  Promise.all(qrPromises).then(() => {
    // Fase 1 completada: pasar a la Fase 2 (Generando PDFs)
    showProgress("pdf");  // Actualiza el texto del área de progreso
    let pdfPromises = processedCertificates.map((cert, index) => {
      return new Promise((resolve) => {
        // Genera un nombre único basado en la fila y el índice
        let uniqueFileName = generateUniqueFileName(cert.row, index);
        exportToPDF(cert.canvas, uniqueFileName, function(success) {
          pdfProcessed++;
          updateProgress(pdfProcessed, totalCertificates);
          if (!success) {
            errorsCount++;
          }
          resolve();
        });
      });
    });
    Promise.all(pdfPromises).then(() => {
      hideProgress();
      if (errorsCount === 0) {
        alert("Certificados generados exitosamente.");
      } else {
        alert(`Se generaron certificados con ${errorsCount} error(es).`);
      }
    });
  });
}

function generateUniqueFileName(row, index) {
  // Obtiene el nombre de la fila utilizando diferentes claves posibles
  let name = row['nombre'] || row['nombres'] || row['NOMBRE'] || row['NOMBRES'] || `certificado_${index}`;
  // Reemplaza espacios por guiones bajos
  let baseName = name.replace(/\s+/g, '_');
  
  // Si el nombre base aún no se ha usado, se registra y se retorna tal cual.
  if (!fileNameCounts[baseName]) {
    fileNameCounts[baseName] = 1;
    return baseName;
  } else {
    // Si ya se usó, se le agrega un contador entre paréntesis
    let count = fileNameCounts[baseName];
    fileNameCounts[baseName] = count + 1;
    return baseName + `(${count})`;
  }
}


function populateColumnsMenu() {
  const menu = document.getElementById("columns-menu");
  // Limpiar el menú
  menu.innerHTML = '<option value="">Datos</option>';
  if (dataRows.length > 0) {
    const columns = Object.keys(dataRows[0]);
    columns.forEach(col => {
      const option = document.createElement("option");
      option.value = col;
      option.text = col;
      menu.appendChild(option);
    });
  }
}
// Exporta el canvas a PDF y lo agrega al ZIP (usando píxeles para preservar posiciones)
function exportToPDF(canvasInstance, fileName, callback) {
  try {
    const svgString = canvasInstance.toSVG();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    // Asegurarse de que el SVG tenga un viewBox acorde al tamaño del canvas
    if (!svgElement.getAttribute('viewBox')) {
      svgElement.setAttribute('viewBox', `0 0 ${canvasInstance.width} ${canvasInstance.height}`);
    }

    // Crear el documento PDF usando 'px' como unidad para que se conserve la posición
    const pdf = new window.jspdf.jsPDF('l', 'px', [canvasInstance.width, canvasInstance.height]);

    pdf.svg(svgElement, {
      x: 0,
      y: 0,
      scale: 1
    })
    .then(() => {
      zip.file(`${fileName}.pdf`, pdf.output('blob'));
      callback(true);
    })
    .catch((error) => {
      console.error("Error al exportar a PDF:", error);
      callback(false);
    });
  } catch (error) {
    console.error("Error al exportar a PDF:", error);
    callback(false);
  }
}
  

// Función para descargar el archivo ZIP que contiene todos los certificados generados
function downloadAll() {
  zip.generateAsync({ type: 'blob' }).then(function(content) {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "certificados.zip";
    a.click();
  });
}

function deleteSelected() {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.remove(activeObject);
    canvas.discardActiveObject(); // limpia la selección
    canvas.renderAll();
  }
}


/**
 * Reemplaza todas las ocurrencias de 'marker' en el objeto de texto por 'replacement'
 * y copia los estilos (almacenados en obj.styles) de la porción del marcador a la porción
 * reemplazada.
 * 
 * Nota: Esta función asume que el objeto de texto está en un formato sencillo (por ejemplo, una línea)
 * y que el marcador se encuentra en la misma línea. Para casos más complejos habría que ampliarla.
 */
function replaceTextWithStyles(obj, marker, replacement) {
  // Separamos el texto en líneas (Fabric.js almacena los estilos por línea)
  let lines = obj.text.split('\n');
  let newStyles = {};
  
  // Recorremos cada línea
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let line = lines[lineIndex];
    newStyles[lineIndex] = {};
    let newLine = "";
    let i = 0; // índice en la línea original
    while (i < line.length) {
      // Si se encuentra el marcador en la posición actual:
      if (line.substr(i, marker.length) === marker) {
        // Tomamos el estilo del primer carácter del marcador (puedes mejorarlo para combinar estilos de toda la porción)
        let markerStyle = {};
        if (obj.styles[lineIndex] && obj.styles[lineIndex][i]) {
          markerStyle = Object.assign({}, obj.styles[lineIndex][i]);
        }
        // Agregamos el texto de reemplazo a la nueva línea
        newLine += replacement;
        // Para cada carácter del texto de reemplazo, asignamos el estilo obtenido
        for (let j = 0; j < replacement.length; j++) {
          newStyles[lineIndex][newLine.length - replacement.length + j] = markerStyle;
        }
        i += marker.length; // saltamos el marcador en la línea original
      } else {
        // Copiamos el carácter actual y su estilo, si existe
        newLine += line[i];
        if (obj.styles[lineIndex] && obj.styles[lineIndex][i]) {
          newStyles[lineIndex][newLine.length - 1] = obj.styles[lineIndex][i];
        }
        i++;
      }
    }
    lines[lineIndex] = newLine;
  }
  
  // Actualizamos el objeto de texto
  obj.text = lines.join('\n');
  obj.styles = newStyles;
}

function saveTemplate() {
    const json = JSON.stringify(canvas.toJSON());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "plantilla.json";
    a.click();
    URL.revokeObjectURL(url);

    savedHistoryIndex = historyIndex; // <-- AÑADE ESTA LÍNEA
    console.log("Progreso guardado. El índice de guardado es:", savedHistoryIndex); // Opcional: para depuración
  }

function generatePreview() {
    
    //if (dataRows.length === 0) {
    //  alert("Primero carga el archivo Excel para obtener los datos.");
    //  return;
    //}
  
    // Tomamos la primera fila de datos
    const row = dataRows[0];
  
    // Creamos o limpiamos el canvas de vista previa
    const previewCanvasElement = document.getElementById('preview-canvas');
    // Si ya se ha inicializado un canvas de Fabric para la vista previa, lo destruimos
    if (window.previewFabricCanvas) {
      window.previewFabricCanvas.dispose();
    }
    // Creamos el canvas Fabric a partir del elemento existente
    window.previewFabricCanvas = new fabric.Canvas('preview-canvas', { width: 1123, height: 794 });
  
    // Cargamos la configuración del canvas editable en el canvas de vista previa
    window.previewFabricCanvas.loadFromJSON(canvas.toJSON(), function() {
      let qrPromises = [];
      // Recorremos todos los objetos del canvas de vista previa
      window.previewFabricCanvas.getObjects().forEach(obj => {
        // Reemplazar marcadores de texto (excepto QR)
        if ((obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') && !obj.text.includes('{{qr}}')) {
          Object.keys(row).forEach(key => {
            // Usa la función que reemplaza conservando estilos (ya definida en tu código)
            replaceTextWithStyles(obj, `{{${key}}}`, row[key] || '');
          });
        }
  
        // Procesar el marcador de QR si existe
        if ((obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') && obj.text.includes('{{qr}}')) {
          let p = new Promise((resolve, reject) => {
            let qrData = row['qr'];
            if (!qrData || qrData.toString().trim() === "") {
              console.error("No se proporcionó información válida para el QR en la fila:", row);
              return resolve();
            }
            let fontSize = obj.fontSize || 30; // Usamos 30 como valor por defecto si no existe
            let qrWidth = fontSize * 5;
            // Generar el QR con tamaño predefinido y sin margen
            QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H', width: qrWidth, margin: 0 }, function(err, url) {
              if (err) {
                console.error("Error generando QR:", err);
                resolve();
              } else {
                fabric.Image.fromURL(url, function(img) {
                  img.set({
                    left: obj.left,
                    top: obj.top,
                    angle: obj.angle,
                    scaleX: 1,
                    scaleY: 1
                  });
                  window.previewFabricCanvas.remove(obj);
                  window.previewFabricCanvas.add(img);
                  resolve();
                });
              }
            });
          });
          qrPromises.push(p);
        }
      });
  
      // Una vez procesados los posibles QR, se renderiza el canvas de vista previa
      Promise.all(qrPromises).then(() => {
        window.previewFabricCanvas.renderAll();
      });
    });
  }

// Al final de qr.js, después de definir generatePreview():
function undo() {
  if (historyIndex > 0) {
    historyLock = true; // Bloqueamos para no guardar este cambio
    historyIndex--;
    canvas.loadFromJSON(history[historyIndex], () => {
      canvas.renderAll();
      historyLock = false; // Desbloqueamos
    });
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyLock = true; // Bloqueamos para no guardar este cambio
    historyIndex++;
    canvas.loadFromJSON(history[historyIndex], () => {
      canvas.renderAll();
      historyLock = false; // Desbloqueamos
    });
  }
}

// Función debounce para evitar actualizaciones excesivas
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Creamos una versión debounced de generatePreview, con 300ms de retardo
const debouncedGeneratePreview = debounce(generatePreview, 300);

// Agregar listeners globales al canvas principal
canvas.on('object:added', () => {
  debouncedGeneratePreview();
  saveState(); // Guardamos estado al agregar
});
canvas.on('object:removed', () => {
  debouncedGeneratePreview();
  saveState(); // Guardamos estado al eliminar
});
canvas.on('object:modified', () => {
  debouncedGeneratePreview();
  saveState(); // Guardamos estado al modificar
});

// ¡Importante! Guardar el estado inicial
canvas.on('render:after', function() {
    if (history.length === 0) {
        saveState();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    inicializarAtajos(canvas, { undo, redo, deleteSelected, saveTemplate });
});

// Agregar listeners globales al canvas principal
canvas.on('object:modified', debouncedGeneratePreview);
canvas.on('object:added', debouncedGeneratePreview);
canvas.on('object:removed', debouncedGeneratePreview);