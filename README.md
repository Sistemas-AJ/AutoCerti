# UPAO-Certificados

Este sistema permite la generación de certificados personalizados en PDF a partir de una plantilla editable y datos provenientes de un archivo Excel. Está diseñado para la Universidad Privada Antenor Orrego, pero puede adaptarse a otras instituciones.

## ¿Cómo funciona?

1. **Carga de Plantilla y Excel**
   - El usuario puede cargar una plantilla de certificado (editable en el canvas) y un archivo Excel con los datos de los destinatarios.
2. **Edición Visual**
   - Se pueden agregar textos, imágenes y códigos QR al certificado usando el editor visual basado en Fabric.js.
   - Los textos pueden contener "placeholders" (ejemplo: `{{nombre}}`) que serán reemplazados por los datos del Excel.
3. **Campos Dinámicos**
   - El sistema detecta las columnas del Excel y permite insertar campos dinámicos en los textos.
   - Se puede elegir qué columna usar para el nombre del archivo PDF y para el contenido del QR.
4. **Generación de Certificados**
   - Al exportar, el sistema recorre cada fila del Excel, reemplaza los placeholders y genera un PDF personalizado para cada destinatario.
   - Los PDFs pueden descargarse individualmente o en un archivo ZIP.

## Funciones JavaScript principales (ordenadas por prioridad)

### 1. `generateCertificates()`
- **Prioridad máxima.**
- Recorre los datos del Excel, reemplaza los placeholders en la plantilla y genera los PDFs.
- Interconecta con: `exportToPDF`, `generateUniqueFileName`, `showProgress`, `downloadAll`.

### 2. `loadExcel(event)`
- Carga el archivo Excel y extrae los datos en `dataRows`.
- Llama a `populateColumnSelectors` para actualizar los menús dinámicos.

### 3. `addText()`, `addQrPlaceholder()`, `triggerImageUpload()`
- Permiten agregar elementos al canvas (texto, QR, imagen).
- Usan Fabric.js para la edición visual.

### 4. `populateColumnSelectors()`
- Llena los menús desplegables con las columnas del Excel para campos dinámicos.

### 5. `exportToPDF(canvasInstance, fileName, callback)`
- Exporta el contenido del canvas a PDF usando jsPDF y svg2pdf.js.
- Llamado por `generateCertificates` y `exportSinglePDF`.

### 6. `replaceTextWithStyles(obj, marker, replacement)`
- Reemplaza los placeholders en los textos por los valores correspondientes, manteniendo estilos.

### 7. `saveTemplate()` y `loadTemplate(event)`
- Permiten guardar y cargar la plantilla del certificado en formato JSON.

### 8. `undo()`, `redo()`, `deleteSelected()`
- Funciones de edición visual para deshacer, rehacer y eliminar elementos del canvas.

### 9. `generatePreview()`
- Muestra una vista previa del certificado usando los datos de la primera fila del Excel.

### 10. `downloadAll()`
- Descarga todos los certificados generados en un archivo ZIP.

## Interconexión de funciones

- **Edición visual:** El usuario edita la plantilla en el canvas usando `addText`, `addQrPlaceholder`, `triggerImageUpload`, y las herramientas de edición (`undo`, `redo`, etc.).
- **Carga de datos:** Al cargar el Excel (`loadExcel`), se actualizan los menús dinámicos (`populateColumnSelectors`).
- **Generación:** Al exportar (`generateCertificates`), se recorre cada fila del Excel, se reemplazan los placeholders (`replaceTextWithStyles`), se genera el PDF (`exportToPDF`) y se agrega al ZIP (`downloadAll`).
- **Vista previa:** `generatePreview` permite ver cómo quedará el certificado antes de exportar.

## Dependencias principales
- [Fabric.js](https://fabricjs.com/) (edición de canvas)
- [jsPDF](https://github.com/parallax/jsPDF) y [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) (exportación a PDF)
- [xlsx](https://github.com/SheetJS/sheetjs) (lectura de Excel)
- [JSZip](https://stuk.github.io/jszip/) (descarga en ZIP)
- [qrcode](https://github.com/soldair/node-qrcode) (generación de QR)

## Uso rápido
1. Carga una plantilla o crea una desde cero.
2. Carga el archivo Excel con los datos.
3. Inserta los campos dinámicos en los textos.
4. Ajusta el diseño visualmente.
5. Exporta los certificados en PDF o ZIP.

---
Para dudas o mejoras, revisa los archivos JS principales: `qr.js`, `atajos.js`, `diseño.js`.
