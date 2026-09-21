# Especificación de Diseño: Plataforma Integral SGT - Dashboard, Evaluaciones Agrupadas, Formularios y Asistente de Resultados

**Fecha**: 2026-09-21  
**Estado**: Revisión final con el usuario  
**Proyecto**: Sistema Gestor de Evaluaciones de Salud Ocupacional y Prevención Laboral (SGT)  
**Repositorio**: [WebFixSoluciones/sgt](https://github.com/WebFixSoluciones/sgt.git)

---

## 1. Contexto y Nuevos Requerimientos del Usuario

### 1.1 Corrección de Espaciado y Márgenes Horizontales (Feedback Visual)
- **Problema**: Las vistas del panel tenían un contenedor rígido `max-w-7xl` con excesivo espacio vacío a la izquierda y a la derecha (marcado con corchetes rojos `|---|` en la captura del usuario).
- **Solución**: Usar ancho fluido equilibrado (`w-full px-6 sm:px-8 py-6`), reduciendo los espacios muertos laterales para que las tablas y tarjetas aprovechen la pantalla de manera limpia y profesional.

### 1.2 Dashboard Principal Renovado (`/admin`)
- Encabezado corporativo: **"Bienvenido Prevención SGT"** con fecha y resumen rápido.
- **3 Accesos Directos Principales (Tarjetas de Acción Rápida)**:
  1. 🚀 **CREAR EVALUACIÓN**: Abre el asistente guiado paso a paso para crear una evaluación para una empresa y asignarle los formularios que la componen.
  2. 📝 **CREAR FORMULARIO**: Conduce al constructor visual centrado (`FormBuilder`) para diseñar una nueva plantilla de preguntas.
  3. 📊 **VER RESULTADOS**: Dirige directamente al nuevo módulo de Resultados y Descargas.
- Debajo: Tabla de **Evaluaciones Activas y Recientes** con ancho completo y acciones directas.

### 1.3 Módulo Específico Asistente de "Resultados" (`/admin/resultados`)
- Un asistente dedicado para consultar y descargar resultados de cualquier evaluación:
  1. **Selector Visual de Evaluación / Encuesta**: Selección directa mediante tarjeta o selector desplegable de la empresa o campaña a consultar.
  2. **Visualización Gráfica Específica**:
     - Muestra las dimensiones evaluadas y los niveles de riesgo psicométrico (ej. FPSICO 4.0: Tiempo de Trabajo, Autonomía, Carga Mental, Demandas Psicológicas, etc., o baremos de Estrés / LIPS-60).
     - Gráficos interactivos limpios y resumen de participación (total respuestas, completadas, porcentaje de cobertura).
  3. **Botonera Prominente de Descargas Oficiales**:
     - 🔴 **DESCARGAR PDF**: Informe ejecutivo formateado con membrete oficial de SGT Corp. Prevención S.A., gráficos vectoriales y desglose para imprimir o guardar como PDF.
     - 🟢 **DESCARGAR EXCEL**: Libro Excel completo con las respuestas de los trabajadores y tabulación oficial.
     - 🔵 **DESCARGAR FPSICO (TXT)**: Generador del archivo plano oficial `.txt` codificado según las especificaciones del software oficial FPSICO 4.0 del INSST.

### 1.4 Menú Lateral Limpio (Sidebar Dropbox)
- **Cabecera**: Logotipo oficial SGT limpio, sin bloques de usuario sobredimensionados ni textos redundantes.
- **Navegación Esencial**:
  - 🏠 **Inicio / Dashboard** (`/admin`)
  - 📋 **Evaluaciones** (`/admin/evaluaciones`)
  - 📝 **Formularios (Plantillas)** (`/admin/formularios`)
  - 📊 **Resultados e Informes** (`/admin/resultados`)
  - 👥 **Portal Trabajador** (`/evaluar`)
- **Pie**:
  - 🚪 **Cerrar Sesión**

### 1.5 Evaluaciones con Formularios Agrupados y Edición Interna
- Una evaluación (ej: `CHAIDE-2026`) agrupa 1 o más formularios (ej: FPSICO + Estrés + Nocturno).
- Desde la gestión de la evaluación, el administrador puede presionar **"✏️ Editar Formulario"** en cualquiera de los formularios asignados para ajustar preguntas específicas de la empresa.

---

## 2. Arquitectura de Páginas y Rutas

| Ruta | Propósito |
| :--- | :--- |
| `/admin` | **Dashboard Principal**: "Bienvenido Prevención SGT", accesos rápidos (Crear Evaluación, Crear Formulario, Ver Resultados), resumen y listado de evaluaciones recientes con ancho corregido. |
| `/admin/evaluaciones` | **Gestión de Evaluaciones**: Listado completo por empresa, asistente "+ Nueva Evaluación" con selección múltiple de formularios, filtros y acciones. |
| `/admin/evaluaciones/[code]` | **Detalle de Evaluación**: Visualización de formularios asignados, botón para editar cada formulario, respuestas y accesos. |
| `/admin/formularios` | **Catálogo de Formularios (Plantillas)**: Lista de plantillas base oficiales y personalizadas con accesos para editar en el FormBuilder o duplicar. |
| `/admin/formularios/nuevo` | **Constructor de Formularios**: FormBuilder centrado, sin ruido visual. |
| `/admin/formularios/[id]` | **Editor de Formulario**: Modificación de cualquier plantilla existente o formulario de evaluación. |
| `/admin/resultados` | **Módulo Asistente de Resultados**: Selector de evaluación, gráficos específicos y botones de descarga: PDF, EXCEL y FPSICO (TXT). |
| `/evaluar/[code]` | **Portal del Trabajador**: Flujo continuo a través de los formularios agrupados en la evaluación asignada. |

---

## 3. Plan de Verificación

1. **Corrección de Espaciado**: Verificar que el layout use `w-full px-6 sm:px-8` sin los enormes márgenes laterales vacíos.
2. **Dashboard Principal**: Probar los 3 accesos rápidos (Crear Evaluación, Crear Formulario, Ver Resultados) y verificar que naveguen a sus respectivos flujos.
3. **Módulo de Resultados**:
   - Seleccionar una evaluación (ej. `CHAIDE-PSI-2026`).
   - Comprobar que los gráficos se rendericen correctamente.
   - Probar la descarga de Excel multi-formulario.
   - Probar la exportación de FPSICO TXT oficial.
   - Probar la generación e impresión del informe en PDF.
4. **Edición de Formulario desde la Evaluación**: Comprobar el botón "Editar Formulario" que abre el `FormBuilder`.
5. **Compilación y Build**: Ejecutar `npx tsc --noEmit` y `npm run build` garantizando 0 errores.
