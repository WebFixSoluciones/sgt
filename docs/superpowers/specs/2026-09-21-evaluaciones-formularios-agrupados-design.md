# Especificación de Diseño: Separación Arquitectónica de Evaluaciones y Formularios Agrupados

**Fecha**: 2026-09-21  
**Estado**: Aprobado por el usuario  
**Proyecto**: Sistema Gestor de Evaluaciones de Salud Ocupacional y Prevención Laboral (SGT)  
**Repositorio**: [WebFixSoluciones/sgt](https://github.com/WebFixSoluciones/sgt.git)

---

## 1. Contexto y Objetivos

### 1.1 Problema Identificado
En la versión previa existía una ambigüedad entre **Formularios** y **Evaluaciones**:
- La pantalla principal `/admin` se llamaba "Formularios", pero en realidad listaba campañas de empresas con códigos específicos (`CHAIDE-PSI-2026`, `CHAIDE-ESTRES-2026`).
- El menú lateral estaba sobrecargado con tarjetas de usuario grandes, subtítulos redundantes y enlaces fijos quemados a cuatro plantillas oficiales y una sección de "Encuestas en Grupo".
- No existía una entidad "Evaluación" capaz de **agrupar múltiples formularios** (por ejemplo, una evaluación integral para una empresa que requiere aplicar simultáneamente FPSICO 4.0 + Test de Estrés + Trabajo Nocturno bajo un único código para los trabajadores).
- El administrador no disponía de un acceso claro para **editar el formulario asignado a una evaluación específica** directamente desde la gestión de la evaluación.

### 1.2 Objetivos del Rediseño
1. **Diferenciación conceptual y operativa total**:
   - **Formularios**: Catálogo de plantillas e instrumentos base de preguntas (FPSICO 4.0, LIPS-60, Test de Estrés OIT, Trabajo Nocturno, o formularios personalizados creados con el constructor).
   - **Evaluaciones**: Campañas por empresa (ej. *"Evaluación Integral Chaide 2026"*, código `CHAIDE-2026`) que agrupan **uno o más formularios** del catálogo.
2. **Edición in-situ del formulario dentro de la evaluación**:
   - Desde la vista de la evaluación, el administrador puede pulsar **"✏️ Editar Formulario"** en cualquiera de los formularios asignados para ajustar preguntas específicas de la empresa sin dañar la plantilla maestra base.
3. **Limpieza radical del Menú Lateral (Sidebar Dropbox)**:
   - Eliminar el bloque de usuario grande tachado.
   - Eliminar las plantillas fijas y encuestas en grupo quemadas al pie del sidebar.
   - Establecer una navegación limpia de 3 opciones: **Evaluaciones**, **Formularios (Plantillas)** y **Portal Trabajador**, con botón sobrio de cierre de sesión.
4. **Respuestas, Gráficos y Descargas Excel por Evaluación**:
   - Dentro de cada evaluación: pestañas para cada formulario agrupado.
   - Gráficos específicos para cada instrumento.
   - Descarga en Excel multi-hoja consolidada: un solo archivo `.xlsx` con una pestaña por cada formulario respondido para esa empresa.
5. **Experiencia del Trabajador unificada**:
   - El trabajador ingresa un solo código de evaluación (ej. `CHAIDE-2026`).
   - El sistema lo guía a través de los formularios asignados (Formulario 1 ➔ Formulario 2 ➔ Formulario 3) con guardado automático.

---

## 2. Modelo de Datos y Arquitectura

### 2.1 Esquema de Campañas de Evaluación (`EvaluationCampaign`)
Se actualiza `src/lib/types.ts`:
```typescript
export interface EvaluationCampaign {
  id: string;
  code: string; // ej. "CHAIDE-2026", usado en /evaluar/[code]
  title: string; // ej. "Evaluación Integral Chaide 2026"
  company: string; // ej. "Chaide y Chaide"
  formIds: string[]; // Lista ordenada de IDs de formularios agrupados: ['form-fpsico-40', 'form-estres', 'form-nocturno']
  formId?: string; // Compatibilidad retroactiva con evaluaciones de 1 solo formulario
  expectedParticipants: number;
  status: 'active' | 'inactive';
  visits: number;
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 Duplicación / Aislamiento para Edición de Formularios por Evaluación
Cuando el administrador decide editar un formulario asignado a una evaluación:
- Si el formulario asignado es una plantilla maestra (ej. `form-fpsico-40`), el sistema permite editarlo o crear una variante vinculada a la evaluación (`form-eval-[evalCode]-[templateId]`) para mantener la plantilla original limpia.
- Los cambios quedan guardados en `FormSchema` y reflejados de inmediato en la evaluación.

### 2.3 Respuestas del Trabajador (`WorkerSubmission`)
```typescript
export interface WorkerSubmission {
  id: string;
  evaluationCode: string;
  workerCode: string;
  status: 'in_progress' | 'completed';
  currentFormIndex: number; // Índice del formulario activo (0..N-1)
  currentFieldIndex: number;
  currentSectionTitle: string;
  answers: Record<string, string | number>; // fieldId -> valor
  ip: string;
  userAgent: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

---

## 3. Arquitectura de Navegación y UI

### 3.1 Menú Lateral Limpio (`AdminSidebarRight.tsx`)
- **Cabecera**:
  - Logo oficial **SGT Corp. Prevención S.A.** con enlace al panel.
  - Indicador sutil de administración, sin tarjetas de usuario voluminosas.
- **Navegación**:
  - `📋 Evaluaciones` (`/admin` o `/admin/evaluaciones`): Gestión de evaluaciones por empresa.
  - `📝 Formularios` (`/admin/formularios`): Catálogo y editor de plantillas maestras.
  - `👥 Portal Trabajador` (`/evaluar`): Enlace para probar el acceso del trabajador.
- **Pie**:
  - Botón minimalista de **Cerrar Sesión**.

### 3.2 Panel de Evaluaciones (`/admin`)
- **Listado**:
  - Columnas: Estado, Título de Evaluación, Empresa, Código de Acceso, **Formularios Agrupados** (píldoras informativas de cada cuestionario incluido), Total de Respuestas, Visitas, Acciones.
- **Asistente "+ Nueva Evaluación" (`AdminEvaluationWizard`)**:
  - Paso 1: Datos de Campaña (Empresa, Título, Código sugerido automático).
  - Paso 2: **Selección de Formularios** (lista con casillas de verificación para seleccionar 1 o varios formularios del catálogo de plantillas).
  - Paso 3: Resumen y Confirmación.
- **Acciones Rápidas por Evaluación**:
  - 👁️ **Gestionar Evaluación / Ver Respuestas**: Conduce a la vista integral de la evaluación.
  - 🔗 **Copiar enlace de acceso directo** (`/evaluar/[CODIGO]`).
  - ⚡ **Activar / Desactivar**.

### 3.3 Vista Integral de una Evaluación (`/admin/evaluaciones/[code]`)
- **Cabecera**: Nombre de la empresa, código de acceso, total de participantes y botones de descarga general.
- **Barra de Pestañas**:
  - `Resumen General`: Métricas de avance, participantes completados vs en proceso, y acceso a los formularios.
  - `[Formulario 1 - ej. FPSICO 4.0]`:
    - Botón destacado: **"✏️ Editar Formulario"** (abre el constructor centrado para este formulario).
    - Estadísticas y baremos / gráficos de este formulario.
    - Tabla de respuestas de este formulario.
  - `[Formulario 2 - ej. Estrés Laboral]`:
    - Botón **"✏️ Editar Formulario"**.
    - Gráficos y baremos de estrés.
    - Tabla de respuestas de este formulario.
  - `[Formulario 3 ...]`: Misma estructura modular.
- **Centro de Descargas**:
  - Botón: **📥 Descargar Excel Multi-Hoja**: Genera un solo archivo `.xlsx` estructurado:
    - Hoja 1: *Resumen Participantes* (Códigos de trabajador, fecha, estado por formulario).
    - Hoja 2..N: *Una hoja dedicada por cada formulario agrupado* con todas las preguntas y respuestas numéricas.
  - Botón: **📄 Exportar TXT FPSICO 4.0** (si el cuestionario FPSICO está incluido en la evaluación).

### 3.4 Catálogo de Formularios (`/admin/formularios`)
- Lista de plantillas disponibles en el sistema (FPSICO 4.0, LIPS-60, Estrés Laboral, Trabajo Nocturno, + formularios personalizados).
- Botón **"+ Nuevo Formulario"** que abre el constructor centrado `FormBuilder`.
- Botón para editar cualquier plantilla base.

### 3.5 Flujo del Trabajador (`/evaluar/[code]`)
- Pantalla de bienvenida con el logotipo corporativo oficial y título de la evaluación de la empresa.
- Al ingresar el código de trabajador:
  - El sistema detecta cuántos formularios componen la evaluación.
  - Muestra un indicador superior de progreso de la evaluación: *"Formulario 1 de 2: Cuestionario de Salud Ocupacional"*.
  - Al completar el primer formulario, avanza con animación fluida al siguiente formulario sin pedir de nuevo el código de trabajador.
  - Al finalizar todos los formularios agrupados, muestra la pantalla de agradecimiento y éxito.

---

## 4. Plan de Verificación

1. **Pruebas de Compilación y Tipado**:
   - `npx tsc --noEmit` sin errores con los tipos de `formIds` y estructuras agrupadas.
   - `npm run build` verificando la generación de todas las rutas dinámicas y estáticas.
2. **Prueba de Creación de Evaluación Agrupada**:
   - Crear una evaluación con 2 formularios (ej. Estrés Laboral + Trabajo Nocturno).
   - Verificar que ambos formularios aparecen vinculados a la evaluación.
3. **Prueba de Edición de Formulario desde la Evaluación**:
   - Acceder al detalle de la evaluación y abrir el constructor de uno de sus formularios.
   - Modificar una pregunta o etiqueta y confirmar que se guarda correctamente.
4. **Prueba de Flujo del Trabajador**:
   - Acceder con el código de la evaluación multiformulario, responder y verificar que pasa fluidamente de un formulario al siguiente.
5. **Prueba de Exportación Excel**:
   - Descargar el archivo Excel consolidado y verificar que contiene las pestañas correspondientes a cada formulario.
