# Especificación de Diseño: Evaluaciones Abiertas (Sin Código de Trabajador ni Límite)

**Fecha:** 30 de septiembre de 2026  
**Estado:** Propuesta de Diseño  
**Autor:** Antigravity (Google DeepMind) & Web Fix Soluciones  

---

## 1. Contexto y Necesidad
Actualmente, el sistema SGT exige que toda evaluación tenga una meta fija de trabajadores previstos (`expectedParticipants > 0`) y que cada trabajador ingrese un "Código de Trabajador (COD)" obligatorio para identificarse al responder.

El administrador requiere poder crear **Evaluaciones Abiertas**, permitiendo que:
1. No exista un límite obligatorio de trabajadores previstos (participación libre / ilimitada).
2. No se requiera ni solicite un código de trabajador al encuestado para ingresar a responder.
3. El enlace de la evaluación pueda ser compartido libremente (por WhatsApp, correo, intranet o código QR) y cualquier persona pueda responder de forma directa y confidencial.

---

## 2. Decisiones de Diseño Acordadas con el Usuario
1. **Activación:** Se incluye un selector/switch destacado en el Creador de Evaluaciones (`AdminEvaluationWizard`) y en el Modal de Edición (`EditEvaluationModal`):  
   *"Evaluación Abierta (Sin código de trabajador ni límite)"*.
2. **Experiencia del Encuestado (`/evaluar/[code]`):**  
   Al abrir el enlace, se muestra una pantalla de bienvenida limpia con el logo corporativo, los datos de la empresa y la evaluación, una insignia indicando que es una evaluación abierta/confidencial, y un botón directo:  
   **`Comenzar Evaluación →`** (sin solicitar código de trabajador).
3. **Identificación Interna y Exportaciones:**  
   El sistema asigna automáticamente un correlativo secuencial único (ej. `PART-001`, `PART-002`, `PART-003`...) para que cada participante tenga su propio registro independiente, evitando colisiones de respuestas y permitiendo la compatibilidad total con el generador de reportes, cálculos estadísticos, exportación a Excel y archivo INSST FPSICO 4.0 TXT.

---

## 3. Arquitectura y Componentes Afectados

### 3.1 Modelo de Datos (`src/lib/types.ts`)
Se amplía la interfaz `EvaluationCampaign`:
```typescript
export interface EvaluationCampaign {
  // ... campos existentes ...
  isOpenEvaluation?: boolean; // true = Evaluación abierta, sin código ni meta obligatoria
}
```

### 3.2 Capa de Almacenamiento y Consecutivos (`src/lib/storage.ts`)
- Persistencia del atributo `isOpenEvaluation` en `saveCampaign` y `updateCampaign`.
- Función auxiliar `getNextOpenParticipantCode(evaluationCode: string)`:
  - Consulta las respuestas existentes para la evaluación.
  - Encuentra el número secuencial más alto entre códigos con formato `PART-XXX`.
  - Retorna el siguiente formateado (ej. `PART-001`, `PART-002`, ..., `PART-125`).

### 3.3 API de Sesiones y Evaluaciones
1. **`src/app/api/evaluaciones/route.ts`**:
   - `POST` y `PATCH`: Aceptan `isOpenEvaluation: boolean`.
   - Si `isOpenEvaluation` es `true`, `expectedParticipants` puede ser `0` o no definido.
2. **`src/app/api/sesiones/route.ts`**:
   - En la acción `check`: Si la evaluación es abierta (`isOpenEvaluation === true`) y no se proporciona un `workerCode` (o se solicita inicio automático), genera y reserva de inmediato el siguiente `PART-XXX` y devuelve la sesión iniciada para continuar directamente.

### 3.4 Interfaz de Administración
1. **`AdminEvaluationWizard.tsx` (Paso 2):**
   - Interruptor / Switch con diseño visual moderno:
     - Título: **Evaluación Abierta**
     - Subtítulo: *Permite la participación libre y anónima sin solicitar código de trabajador ni requerir un número límite de participantes.*
   - Al activarse:
     - El campo "Trabajadores Esperados" se deshabilita o muestra etiqueta *"Participación Ilimitada"*.
     - La validación del paso 2 permite continuar sin requerir un número fijo de trabajadores.
   - En el Paso 4 (Resumen): Indica claramente *Tipo: Evaluación Abierta (Sin código)*.
2. **`EditEvaluationModal.tsx`:**
   - Permite consultar y modificar el estado de evaluación abierta.
3. **Listado de Evaluaciones (`/admin/evaluaciones/page.tsx`):**
   - En la columna de progreso, para evaluaciones abiertas muestra badge `Abierta` y `{submissionsCount} respuestas recibidas` en lugar de la barra relativa `X de 100`.

### 3.5 Flujo del Trabajador (`src/app/evaluar/[code]/page.tsx`)
- Detecta si `campaign.isOpenEvaluation === true`.
- Si es abierta:
  - La pantalla inicial oculta el campo de entrada `Código de Trabajador (COD)`.
  - Muestra mensaje amigable: *"Esta es una evaluación de participación abierta. No requiere código de identificación personal."*
  - El botón principal dice **"Comenzar Evaluación"**.
  - Al pulsar, invoca la generación del código secuencial `PART-XXX` y accede inmediatamente al primer cuestionario.
  - El participante podrá seleccionar su puesto de trabajo en la primera sección sociodemográfica normalmente.
  - Si la evaluación está enlazada en circuito (`nextEvaluationCode`), el código asignado (`PART-XXX`) se transfiere automáticamente a las siguientes evaluaciones del circuito.

---

## 4. Plan de Verificación y Pruebas
1. **Prueba de Creación:** Crear una evaluación con la opción "Evaluación Abierta" activada sin ingresar número de trabajadores esperados.
2. **Prueba de Edición:** Editar una evaluación existente para alternar entre abierta y cerrada.
3. **Prueba de Respuesta de Usuario:**
   - Acceder al enlace `/evaluar/[COD]`.
   - Verificar que no solicita código de trabajador.
   - Presionar "Comenzar Evaluación" y responder las preguntas seleccionando puesto de trabajo.
   - Finalizar la evaluación con éxito.
4. **Prueba de Múltiples Participantes:**
   - Abrir una segunda ventana de incógnito y responder como segundo participante.
   - Verificar que se asigna `PART-002` sin conflicto con `PART-001`.
5. **Prueba de Exportación Excel & FPSICO:**
   - Descargar el archivo Excel y verificar que las hojas contienen las respuestas asociadas a `PART-001`, `PART-002` y sus puestos.
6. **Compilación y Despliegue:** `npm run build` sin errores.
