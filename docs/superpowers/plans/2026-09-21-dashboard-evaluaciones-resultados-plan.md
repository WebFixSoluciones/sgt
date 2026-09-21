# Plan de Implementación: Dashboard SGT, Evaluaciones Agrupadas, Formularios y Asistente de Resultados

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la plataforma SGT para separar limpiamente Formularios (plantillas) y Evaluaciones (campañas por empresa que agrupan 1 o más formularios), incorporar un Dashboard principal con "Bienvenido Prevención SGT" y accesos directos, corregir el espaciado y márgenes de las tablas, habilitar la edición de formularios dentro de las evaluaciones y crear el nuevo módulo asistente de Resultados con descargas de PDF, Excel y FPSICO TXT.

**Architecture:** 
- Frontend Next.js 14 (App Router) con Tailwind CSS e Inter.
- Separación de rutas: `/admin` (Dashboard de Bienvenida y accesos directos), `/admin/evaluaciones` (Gestión de evaluaciones y asistente de agrupación), `/admin/formularios` (Catálogo de plantillas), `/admin/resultados` (Asistente de resultados con gráficos y descargas de PDF, Excel y TXT).
- Modelo de datos ampliado con `formIds: string[]` en `EvaluationCampaign` para evaluaciones multiformulario.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, xlsx, FileSaver / HTML Print Engine.

---

### Task 1: Corrección de Espaciado y Limpieza del Menú Lateral (Sidebar)

**Archivos:**
- Modificar: `src/components/admin/AdminSidebarRight.tsx`
- Modificar: `src/app/admin/layout.tsx` (si aplica)

- [ ] **Paso 1: Limpiar el encabezado y pie del Sidebar**
  - Quitar el contenedor grande de usuario tachado (`Administrador SGT admin@prevencionsgt.com`).
  - Quitar el subtítulo redundante "SGT Prevención ADMINISTRADOR".
  - Mantener el isotipo/logo corporativo limpio de SGT con enlace directo al Dashboard.
- [ ] **Paso 2: Actualizar la navegación esencial**
  - Agregar enlace a `🏠 Inicio` (`/admin`).
  - Agregar enlace a `📋 Evaluaciones` (`/admin/evaluaciones`).
  - Agregar enlace a `📝 Formularios` (`/admin/formularios`).
  - Agregar enlace a `📊 Resultados` (`/admin/resultados`).
  - Mantener enlace a `👥 Portal Trabajador` (`/evaluar`).
  - Eliminar los bloques quemados de "Plantillas Oficiales" y "Encuestas en Grupo" tachados en la captura del usuario.
  - Dejar botón minimalista de `🚪 Cerrar Sesión` al pie.
- [ ] **Paso 3: Corregir el espaciado y márgenes laterales**
  - Reemplazar las clases restrictivas con excesivo margen lateral (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) por un ancho fluido con padding balanceado (`w-full px-6 sm:px-8 py-6`), eliminando los espacios muertos señalados con corchetes rojos `|---|`.
- [ ] **Paso 4: Verificar tipado y compilar**
  - Ejecutar `npx tsc --noEmit`.
- [ ] **Paso 5: Confirmar cambios en Git**

---

### Task 2: Modelo de Datos y Soporte Multi-Formulario

**Archivos:**
- Modificar: `src/lib/types.ts`
- Modificar: `src/lib/storage.ts`
- Modificar: `src/lib/seed-data.ts`
- Modificar: `src/app/api/evaluaciones/route.ts`
- Modificar: `src/app/api/evaluaciones/[code]/route.ts`

- [ ] **Paso 1: Extender interfaces en `types.ts`**
  - Añadir `formIds: string[]` en `EvaluationCampaign` (manteniendo `formId?: string` para compatibilidad retroactiva).
  - Añadir `currentFormIndex?: number` en `WorkerSubmission`.
- [ ] **Paso 2: Actualizar `seed-data.ts` y `storage.ts`**
  - Asignar `formIds` a las campañas iniciales (ej. Chaide agrupa `['form-fpsico-40', 'form-estres', 'form-nocturno']`).
  - Asegurar que `getCampaignByCode` y endpoints retornen todos los esquemas de los formularios asociados en `forms: FormSchema[]`.
- [ ] **Paso 3: Verificar endpoints con llamadas API locales**
  - Probar GET `/api/evaluaciones` y GET `/api/evaluaciones/[code]`.
- [ ] **Paso 4: Confirmar cambios en Git**

---

### Task 3: Dashboard Principal Renovado (`/admin/page.tsx`)

**Archivos:**
- Modificar: `src/app/admin/page.tsx`

- [ ] **Paso 1: Crear encabezado "Bienvenido Prevención SGT"**
  - Tipografía Inter limpia, fecha actual, indicador de estado de plataforma y contadores rápidos (Evaluaciones activas, Formularios base, Total respuestas).
- [ ] **Paso 2: Diseñar los 3 accesos directos destacados**
  - **Tarjeta 1: CREAR EVALUACIÓN** (Icono cohete/plus, título y descripción clara, botón que abre el asistente de creación multiformulario).
  - **Tarjeta 2: CREAR FORMULARIO** (Icono editor/formulario, botón que redirige a `/admin/formularios/nuevo` en el constructor centrado).
  - **Tarjeta 3: VER RESULTADOS** (Icono gráficos/reportes, botón que redirige al nuevo módulo `/admin/resultados`).
- [ ] **Paso 3: Tabla de Evaluaciones Recientes sin márgenes muertos**
  - Ocupando el ancho completo disponible.
  - Columnas: Estado, Título, Empresa, Código, Formularios que la componen (badges legibles de cada formulario incluido), Total respuestas, y botones de acción (Ver Respuestas/Gráficos, Copiar Enlace, Activar/Desactivar).
- [ ] **Paso 4: Confirmar cambios en Git**

---

### Task 4: Gestión de Evaluaciones y Asistente Multiformulario (`/admin/evaluaciones`)

**Archivos:**
- Crear: `src/app/admin/evaluaciones/page.tsx`
- Modificar: `src/components/admin/AdminEvaluationWizard.tsx`

- [ ] **Paso 1: Crear la página de gestión integral de Evaluaciones (`/admin/evaluaciones/page.tsx`)**
  - Filtros por estado (Todos, Activos, Inactivos), buscador por empresa o código.
  - Botón principal `+ Nueva Evaluación`.
- [ ] **Paso 2: Actualizar `AdminEvaluationWizard.tsx` para selección múltiple de formularios**
  - Paso 1: Empresa, Título de Campaña y Código de acceso (ej. `CHAIDE-2026`).
  - Paso 2: **Selección de Formularios**: Listado con casillas de verificación (checkboxes) de todas las plantillas disponibles (FPSICO 4.0, LIPS-60, Estrés Laboral, Trabajo Nocturno, y formularios personalizados) con contador de preguntas y orden ajustable.
  - Paso 3: Confirmación y pantalla de éxito con enlace copiable.
- [ ] **Paso 3: Habilitar botón "✏️ Editar Formulario" para personalizar preguntas de la evaluación**
  - Enlace directo al `FormBuilder` pasando el ID del formulario con parámetro de retorno a la evaluación.
- [ ] **Paso 4: Confirmar cambios en Git**

---

### Task 5: Catálogo de Plantillas de Formularios (`/admin/formularios/page.tsx`)

**Archivos:**
- Crear: `src/app/admin/formularios/page.tsx`

- [ ] **Paso 1: Crear vista de catálogo de plantillas**
  - Listado de formularios disponibles (FPSICO 4.0 INSST, Cuestionario LIPS-60, Test de Estrés Laboral OIT, Encuesta de Trabajo Nocturno, y formularios creados por el admin).
  - Cada tarjeta o fila muestra: Título, categoría, total de preguntas, última actualización.
  - Botón `✏️ Editar en Constructor` (abre `FormBuilder`).
  - Botón `📋 Duplicar Plantilla`.
  - Botón principal en cabecera `+ Crear Formulario` hacia `/admin/formularios/nuevo`.
- [ ] **Paso 2: Confirmar cambios en Git**

---

### Task 6: Módulo Asistente de Resultados con Descargas (`/admin/resultados/page.tsx`)

**Archivos:**
- Crear: `src/app/admin/resultados/page.tsx`
- Modificar / Crear utilidades de exportación si se requiere

- [ ] **Paso 1: Asistente con Selector de Evaluación**
  - Selector visual o desplegable elegante para elegir la evaluación/empresa a consultar.
  - Resumen métrico de la evaluación seleccionada (Participantes, respuestas completadas, tasa de finalización).
- [ ] **Paso 2: Visualización de Gráficos Específicos**
  - Si la evaluación agrupa varios formularios, selector de pestañas para ver los resultados de cada formulario.
  - Gráficos de barras de niveles de riesgo y dimensiones para FPSICO 4.0, Estrés Laboral o LIPS-60.
- [ ] **Paso 3: Botonera Prominente de Descargas**
  - 🔴 **DESCARGAR PDF**: Genera y abre el informe ejecutivo oficial formateado para impresión o guardado directo en PDF con membrete corporativo de SGT.
  - 🟢 **DESCARGAR EXCEL**: Descarga el libro Excel con todas las respuestas tabuladas y baremos.
  - 🔵 **DESCARGAR FPSICO (TXT)**: Genera y descarga el archivo `.txt` oficial compatible con el software FPSICO 4.0 del INSST (cuando la evaluación incluye FPSICO).
- [ ] **Paso 4: Confirmar cambios en Git**

---

### Task 7: Flujo Multiformulario del Trabajador (`/evaluar/[code]`)

**Archivos:**
- Modificar: `src/app/evaluar/[code]/page.tsx`

- [ ] **Paso 1: Cargar todos los formularios agrupados en la evaluación**
  - Al ingresar el código (ej. `CHAIDE-2026`), obtener la lista de formularios de la evaluación.
- [ ] **Paso 2: Flujo continuo guiado formulario a formulario**
  - Barra superior sutil que indica: *"Formulario 1 de 3: FPSICO 4.0"* ➔ *"Formulario 2 de 3: Test de Estrés"*.
  - Transición fluida entre formularios sin volver a pedir el código.
  - Pantalla final de éxito al terminar todos los formularios asignados.
- [ ] **Paso 3: Confirmar cambios en Git**

---

### Task 8: Verificación Completa y Despliegue en GitHub

**Archivos:**
- Todos los modificados

- [ ] **Paso 1: Ejecutar verificación de tipos TypeScript**
  - `npx tsc --noEmit`
- [ ] **Paso 2: Ejecutar compilación completa Next.js**
  - `npm run build`
- [ ] **Paso 3: Enviar a la rama principal en GitHub**
  - `git push origin main`
- [ ] **Paso 4: Actualizar `walkthrough.md` y presentar al usuario**
