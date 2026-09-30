# Plan de Implementación: Evaluaciones Abiertas (Sin Código de Trabajador ni Límite)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al administrador crear evaluaciones abiertas sin límite de trabajadores esperados y sin exigir código de trabajador al encuestado, asignando internamente un código secuencial correlativo (`PART-001`, `PART-002`, etc.) para el registro ordenado e independiente de respuestas.

**Architecture:** Se agrega el campo `isOpenEvaluation` en `EvaluationCampaign`. El backend genera secuenciales correlativos de participantes (`getNextOpenParticipantCode`), la API de sesiones (`/api/sesiones`) soporta inicio anónimo directo, el asistente y editor en el administrador ofrecen el switch de activación, y la vista del trabajador (`/evaluar/[code]`) reemplaza el campo de código por un botón directo de inicio.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, File/Blob Storage.

---

### Task 1: Modelo de Datos y Storage Backend

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/storage.ts`

- [ ] **Step 1: Agregar `isOpenEvaluation` en `src/lib/types.ts`**
  - Añadir `isOpenEvaluation?: boolean;` a la interfaz `EvaluationCampaign`.

- [ ] **Step 2: Actualizar `src/lib/storage.ts` para persistir `isOpenEvaluation` y generar códigos secuenciales**
  - En `saveCampaign` y `updateCampaign`, asegurar que `isOpenEvaluation` se preserve y persista.
  - Implementar la función exportada:
    ```typescript
    export async function getNextOpenParticipantCode(evaluationCode: string): Promise<string>
    ```
    que analiza las respuestas de esa evaluación y retorna el próximo `PART-001`, `PART-002`, etc.

- [ ] **Step 3: Compilar y verificar tipos**
  - Verificar que no haya errores de tipo en `src/lib/storage.ts`.

---

### Task 2: APIs de Evaluaciones y Sesiones

**Files:**
- Modify: `src/app/api/evaluaciones/route.ts`
- Modify: `src/app/api/sesiones/route.ts`

- [ ] **Step 1: Modificar `src/app/api/evaluaciones/route.ts`**
  - En `POST`: Recibir `isOpenEvaluation`. Si es `true`, permitir `expectedParticipants: 0`.
  - En `PATCH`: Recibir y actualizar `isOpenEvaluation`.

- [ ] **Step 2: Modificar `src/app/api/sesiones/route.ts`**
  - En `POST` cuando `action === 'check'`:
    - Si la campaña tiene `isOpenEvaluation === true`:
      - Si `workerCode` es `'__auto__'` o viene vacío:
        - Obtener el siguiente código secuencial con `getNextOpenParticipantCode(evaluationCode)`.
        - Inicializar la sesión con ese código y responder exitosamente con `{ success: true, workerCode: assignedCode, answers: {}, isNew: true }`.
      - Si viene un código explícito (ej. transferencia en circuito), verificar si ya completó o permitir continuar.

---

### Task 3: Creador y Editor de Evaluaciones en el Administrador

**Files:**
- Modify: `src/components/admin/AdminEvaluationWizard.tsx`
- Modify: `src/components/admin/EditEvaluationModal.tsx`

- [ ] **Step 1: Actualizar `AdminEvaluationWizard.tsx`**
  - Añadir estado `const [isOpenEvaluation, setIsOpenEvaluation] = useState(false);`
  - En el Paso 2:
    - Agregar tarjeta/switch interactivo para "Evaluación Abierta".
    - Cuando está activo, deshabilitar o mostrar "Sin límite (Abierta)" en Trabajadores Esperados.
    - Actualizar `canProceedStep2`: `company.trim() && title.trim() && code.trim() && (isOpenEvaluation || Number(expectedParticipants) > 0)`.
    - En el payload de creación incluir `isOpenEvaluation`.
  - En el Paso 4 (Resumen previo a crear):
    - Mostrar distintivo "Tipo: Evaluación Abierta" o "Tipo: Cerrada (con código)".

- [ ] **Step 2: Actualizar `EditEvaluationModal.tsx`**
  - Añadir soporte para visualizar y conmutar `isOpenEvaluation`.
  - Enviar `isOpenEvaluation` en el PATCH.

---

### Task 4: Flujo del Trabajador en Evaluaciones Abiertas

**Files:**
- Modify: `src/app/evaluar/[code]/page.tsx`

- [ ] **Step 1: Actualizar pantalla de bienvenida (`!isLoggedIn`)**
  - Si `campaign.isOpenEvaluation === true`:
    - Ocultar el formulario con campo de texto `Código de Trabajador (COD)`.
    - Mostrar aviso de evaluación abierta y confidencial.
    - Mostrar botón prominente: **`Comenzar Evaluación →`**.
    - Al hacer clic, invocar `handleWorkerCheck('__auto__')`.
  - En `handleWorkerCheck`:
    - Soportar `targetCode === '__auto__'` o `campaign.isOpenEvaluation`.
    - Enviar la petición a `/api/sesiones` con `workerCode: '__auto__'`.
    - Al recibir el código asignado (ej. `PART-001`), guardarlo en estado y pasar a la evaluación.

- [ ] **Step 2: Mantener encadenamiento fluido**
  - Si una evaluación abierta pasa a la siguiente en un circuito, transferir el código asignado (`PART-001`) vía query param para mantener la trazabilidad uniforme.

---

### Task 5: Vistas del Panel Administrativo

**Files:**
- Modify: `src/app/admin/evaluaciones/page.tsx`

- [ ] **Step 1: Actualizar tabla de evaluaciones**
  - Si `camp.isOpenEvaluation` es `true`:
    - Mostrar badge verde/cyan `Abierta` junto al título o en la columna de progreso.
    - Mostrar `{camp.submissionsCount || 0} respuestas` sin barra de límite fija.

---

### Task 6: Verificación, Compilación y Commit

**Files:**
- Run: `npm run build`
- Git commit & push

- [ ] **Step 1: Ejecutar `npm run build` para asegurar compilación exitosa.**
- [ ] **Step 2: Commit y push a `origin/main`.**
