import fs from 'fs';
import path from 'path';
import { FormSchema, EvaluationCampaign, WorkerSubmission, EvaluationGroup } from './types';
import { initialForms, initialCampaigns, initialGroups, initialSubmissions } from './seed-data';
import { getEcuadorISOString } from './date-utils';

interface DatabaseSchema {
  forms: FormSchema[];
  campaigns: EvaluationCampaign[];
  submissions: WorkerSubmission[];
  groups: EvaluationGroup[];
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(LOCAL_DATA_DIR, 'db.json');

const SERVERLESS_DATA_DIR = path.join('/tmp', 'sgt_data');
const SERVERLESS_DB_FILE = path.join(SERVERLESS_DATA_DIR, 'db.json');

const DATA_DIR = IS_SERVERLESS ? SERVERLESS_DATA_DIR : LOCAL_DATA_DIR;
const DB_FILE = IS_SERVERLESS ? SERVERLESS_DB_FILE : LOCAL_DB_FILE;

// In-memory cache for speed with TTL invalidation
let memDb: DatabaseSchema | null = null;
let lastDbReadTime = 0;
const CACHE_TTL_MS = 1500; // 1.5s cache for serverless concurrency

function getInitialDb(): DatabaseSchema {
  return {
    forms: initialForms,
    campaigns: initialCampaigns,
    submissions: initialSubmissions,
    groups: initialGroups,
  };
}

async function readFromDiskOrBlob(): Promise<DatabaseSchema> {
  // 1. Check if Vercel Blob is configured (Cloud Database)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob');
      const blobs = await list();
      const dbBlobs = blobs.blobs.filter(
        (b) => b.pathname.startsWith('db') && b.pathname.endsWith('.json')
      );
      if (dbBlobs.length > 0) {
        // Sort descending: newest uploaded snapshot first
        dbBlobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        const newestBlob = dbBlobs[0];
        const cacheBustUrl = `${newestBlob.downloadUrl || newestBlob.url}?t=${Date.now()}`;
        const response = await fetch(cacheBustUrl, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.campaigns) && Array.isArray(data.forms)) {
            return data;
          }
        }
      }
    } catch (e) {
      console.warn('[STORAGE] Vercel Blob read error, falling back to disk:', e);
    }
  }

  // 2. Filesystem fallback (uses /tmp on Vercel/serverless or data/ on local)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } else {
      let initial = getInitialDb();
      if (fs.existsSync(LOCAL_DB_FILE)) {
        try {
          const localContent = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
          initial = JSON.parse(localContent);
        } catch (e) {}
      }
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      } catch (e) {}
      return initial;
    }
  } catch (err) {
    console.error('[STORAGE] Error reading local/tmp DB:', err);
    return getInitialDb();
  }
}

async function writeToDiskOrBlob(db: DatabaseSchema): Promise<void> {
  memDb = db;
  lastDbReadTime = Date.now();

  // 1. Local / Tmp filesystem write
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[STORAGE] Could not write to DB_FILE:', e);
  }

  // Also sync to local data/db.json if running in dev mode
  if (!IS_SERVERLESS && DB_FILE !== LOCAL_DB_FILE) {
    try {
      if (!fs.existsSync(LOCAL_DATA_DIR)) {
        fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {}
  }

  // 2. Vercel Blob write if token exists (Cloud Database)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put, list, del } = await import('@vercel/blob');
      const newSnapshotName = `db-${Date.now()}.json`;
      
      await put(newSnapshotName, JSON.stringify(db, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        cacheControlMaxAge: 0, // Disable CDN caching for database snapshots
      });

      // Cleanup older snapshots keeping the 2 most recent
      try {
        const allBlobs = await list();
        const olderDbBlobs = allBlobs.blobs
          .filter((b) => b.pathname.startsWith('db') && b.pathname.endsWith('.json') && b.pathname !== newSnapshotName)
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(2); // Keep 2 newest historical snapshots for safety
        if (olderDbBlobs.length > 0) {
          await del(olderDbBlobs.map((b) => b.url));
        }
      } catch (cleanupErr) {
        console.warn('[STORAGE] Blob history cleanup note:', cleanupErr);
      }
    } catch (e) {
      console.error('[STORAGE] Error writing to Vercel Blob:', e);
    }
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  const isExpired = Date.now() - lastDbReadTime > CACHE_TTL_MS;
  if (!memDb || isExpired) {
    memDb = await readFromDiskOrBlob();
    lastDbReadTime = Date.now();

    // Guarantee canonical master templates have isTemplate: true and empty company
    const MASTER_TEMPLATE_IDS = [
      'form-fpsico-40',
      'form-lips-60',
      'form-estres-laboral',
      'form-trabajo-nocturno',
    ];
    let modified = false;
    for (const f of memDb.forms) {
      if (MASTER_TEMPLATE_IDS.includes(f.id)) {
        if (f.company || f.isTemplate !== true) {
          f.company = '';
          f.isTemplate = true;
          modified = true;
        }
      }
    }
    if (modified) {
      await writeToDiskOrBlob(memDb);
    }
  }
  return memDb;
}

export async function getDatabaseStatus() {
  const isServerless = IS_SERVERLESS;
  const blobTokenConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  let blobBlobsCount = 0;
  let blobLatestUrl: string | null = null;

  if (blobTokenConfigured) {
    try {
      const { list } = await import('@vercel/blob');
      const res = await list();
      const dbBlobs = res.blobs.filter((b) => b.pathname.startsWith('db') && b.pathname.endsWith('.json'));
      blobBlobsCount = dbBlobs.length;
      if (dbBlobs.length > 0) {
        dbBlobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        blobLatestUrl = dbBlobs[0].url;
      }
    } catch (e: any) {
      blobLatestUrl = `Error al consultar Blob: ${e.message}`;
    }
  }

  const db = await getDatabase();
  return {
    status: 'online',
    isServerless,
    blobTokenConfigured,
    storageDriver: blobTokenConfigured ? 'vercel-blob (Persistente en Nube)' : (isServerless ? 'serverless-tmp (Efímero Lambda)' : 'local-disk (data/db.json)'),
    blobBlobsCount,
    blobLatestUrl,
    counts: {
      campaigns: db.campaigns.length,
      activeCampaigns: db.campaigns.filter((c) => c.status === 'active' && !c.isTrash).length,
      inactiveCampaigns: db.campaigns.filter((c) => c.status === 'inactive' && !c.isTrash).length,
      trashCampaigns: db.campaigns.filter((c) => c.status === 'trash' || c.isTrash).length,
      forms: db.forms.length,
      submissions: db.submissions.length,
    },
    campaigns: db.campaigns.map((c) => ({
      code: c.code,
      title: c.title,
      company: c.company,
      status: c.status,
      isTrash: Boolean(c.isTrash),
    })),
    lastReadTime: new Date(lastDbReadTime).toISOString(),
  };
}

// Campaign Operations
export async function getCampaigns(): Promise<EvaluationCampaign[]> {
  const db = await getDatabase();
  return db.campaigns.map((c) => ({
    ...c,
    formIds: c.formIds && c.formIds.length > 0 ? c.formIds : (c.formId ? [c.formId] : []),
  }));
}

export async function getCampaignByCode(code: string): Promise<EvaluationCampaign | null> {
  const db = await getDatabase();
  const normalized = code.trim().toUpperCase();
  const found = db.campaigns.find((c) => c.code.toUpperCase() === normalized);
  if (!found) return null;
  return {
    ...found,
    formIds: found.formIds && found.formIds.length > 0 ? found.formIds : (found.formId ? [found.formId] : []),
  };
}

export async function saveCampaign(campaign: EvaluationCampaign): Promise<EvaluationCampaign> {
  const db = await getDatabase();
  const formIds = campaign.formIds && campaign.formIds.length > 0
    ? campaign.formIds
    : (campaign.formId ? [campaign.formId] : []);
  const normalizedCampaign: EvaluationCampaign = {
    ...campaign,
    formIds,
    formId: formIds[0] || campaign.formId || '',
  };
  const index = db.campaigns.findIndex((c) => c.id === normalizedCampaign.id || c.code === normalizedCampaign.code);
  if (index >= 0) {
    db.campaigns[index] = { ...normalizedCampaign, updatedAt: getEcuadorISOString() };
  } else {
    db.campaigns.unshift(normalizedCampaign);
  }
  await writeToDiskOrBlob(db);
  return normalizedCampaign;
}

export async function getFormsForCampaign(campaign: EvaluationCampaign): Promise<FormSchema[]> {
  const db = await getDatabase();
  const formIds = campaign.formIds && campaign.formIds.length > 0 
    ? campaign.formIds 
    : (campaign.formId ? [campaign.formId] : []);
  
  return formIds
    .map(id => db.forms.find(f => f.id === id || f.code === id))
    .filter((f): f is FormSchema => Boolean(f));
}

export async function toggleCampaignStatus(code: string): Promise<EvaluationCampaign | null> {
  const db = await getDatabase();
  const campaign = db.campaigns.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!campaign) return null;
  campaign.status = campaign.status === 'active' ? 'inactive' : 'active';
  campaign.updatedAt = getEcuadorISOString();
  await writeToDiskOrBlob(db);
  return campaign;
}

export async function trashCampaign(code: string): Promise<EvaluationCampaign | null> {
  const db = await getDatabase();
  const campaign = db.campaigns.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!campaign) return null;
  campaign.status = 'trash';
  campaign.isTrash = true;
  campaign.trashedAt = getEcuadorISOString();
  campaign.updatedAt = getEcuadorISOString();
  await writeToDiskOrBlob(db);
  return campaign;
}

export async function restoreCampaign(code: string): Promise<EvaluationCampaign | null> {
  const db = await getDatabase();
  const campaign = db.campaigns.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!campaign) return null;
  campaign.status = 'active';
  campaign.isTrash = false;
  campaign.trashedAt = undefined;
  campaign.updatedAt = getEcuadorISOString();
  await writeToDiskOrBlob(db);
  return campaign;
}

export async function deleteCampaignPermanently(code: string): Promise<boolean> {
  const db = await getDatabase();
  const norm = code.trim().toUpperCase();
  const initialCount = db.campaigns.length;
  db.campaigns = db.campaigns.filter((c) => c.code.toUpperCase() !== norm);
  db.submissions = db.submissions.filter((s) => s.evaluationCode.toUpperCase() !== norm);
  const deleted = db.campaigns.length < initialCount;
  if (deleted) {
    await writeToDiskOrBlob(db);
  }
  return deleted;
}

export async function emptyTrashCampaigns(): Promise<number> {
  const db = await getDatabase();
  const trashedCodes = db.campaigns
    .filter((c) => c.status === 'trash' || c.isTrash === true)
    .map((c) => c.code.toUpperCase());

  if (trashedCodes.length === 0) return 0;

  db.campaigns = db.campaigns.filter((c) => !trashedCodes.includes(c.code.toUpperCase()));
  db.submissions = db.submissions.filter((s) => !trashedCodes.includes(s.evaluationCode.toUpperCase()));
  await writeToDiskOrBlob(db);
  return trashedCodes.length;
}

export async function incrementCampaignVisits(code: string): Promise<void> {
  const db = await getDatabase();
  const campaign = db.campaigns.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (campaign) {
    campaign.visits = (campaign.visits || 0) + 1;
    await writeToDiskOrBlob(db);
  }
}

// Form Schema Operations
export async function getForms(): Promise<FormSchema[]> {
  const db = await getDatabase();
  return db.forms;
}

export async function getFormById(id: string): Promise<FormSchema | null> {
  const db = await getDatabase();
  return db.forms.find((f) => f.id === id || f.code === id) || null;
}

export async function saveForm(form: FormSchema): Promise<FormSchema> {
  const db = await getDatabase();
  const index = db.forms.findIndex((f) => f.id === form.id);
  if (index >= 0) {
    db.forms[index] = { ...form, updatedAt: getEcuadorISOString() };
  } else {
    db.forms.unshift(form);
  }
  await writeToDiskOrBlob(db);
  return form;
}

export async function deleteForm(id: string): Promise<boolean> {
  const db = await getDatabase();
  const initialCount = db.forms.length;
  db.forms = db.forms.filter((f) => f.id !== id && f.code !== id);
  const deleted = db.forms.length < initialCount;
  if (deleted) {
    await writeToDiskOrBlob(db);
  }
  return deleted;
}

export async function cloneFormForCampaign(
  sourceFormId: string,
  campaign: { code: string; title: string; company: string }
): Promise<FormSchema> {
  const db = await getDatabase();
  const source = db.forms.find((f) => f.id === sourceFormId || f.code === sourceFormId) || db.forms[0];
  if (!source) {
    throw new Error(`Formulario origen no encontrado para clonar: ${sourceFormId}`);
  }

  const cleanCode = campaign.code.trim().toUpperCase();
  const cleanComp = campaign.company.trim();
  const slug = cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const nowEc = getEcuadorISOString();

  const newFormId = `form-${slug}-${Date.now()}`;
  const cloned: FormSchema = {
    id: newFormId,
    title: `${source.title} (${cleanComp})`,
    code: `${cleanCode}-${source.code || 'FORM'}`,
    company: cleanComp,
    description: `Formulario exclusivo adaptado para la evaluación ${cleanCode} de ${cleanComp}. Basado en la plantilla maestra "${source.title}".`,
    isTemplate: false,
    category: source.category,
    fields: JSON.parse(JSON.stringify(source.fields)),
    createdAt: nowEc,
    updatedAt: nowEc,
  };

  db.forms.unshift(cloned);
  await writeToDiskOrBlob(db);
  return cloned;
}

export async function duplicateForm(
  sourceFormId: string,
  newTitle?: string,
  asTemplate: boolean = false,
  company?: string
): Promise<FormSchema> {
  const db = await getDatabase();
  const source = db.forms.find((f) => f.id === sourceFormId || f.code === sourceFormId);
  if (!source) {
    throw new Error('Formulario origen no encontrado para duplicar');
  }

  const nowEc = getEcuadorISOString();
  const duplicated: FormSchema = {
    id: `form-${Date.now()}`,
    title: newTitle ? newTitle.trim() : `Copia de ${source.title}`,
    code: `copy-${source.code || 'form'}-${Date.now()}`,
    company: company || (asTemplate ? '' : source.company || ''),
    description: source.description || '',
    isTemplate: asTemplate,
    category: source.category,
    fields: JSON.parse(JSON.stringify(source.fields)),
    createdAt: nowEc,
    updatedAt: nowEc,
  };

  db.forms.unshift(duplicated);
  await writeToDiskOrBlob(db);
  return duplicated;
}

// Submission / Save & Resume Operations
export async function getSubmissions(evaluationCode?: string): Promise<WorkerSubmission[]> {
  const db = await getDatabase();
  if (!evaluationCode) return db.submissions;
  return db.submissions.filter((s) => s.evaluationCode.toUpperCase() === evaluationCode.toUpperCase());
}

export async function getSubmission(
  evaluationCode: string,
  workerCode: string
): Promise<WorkerSubmission | null> {
  const db = await getDatabase();
  const evalCodeNorm = evaluationCode.trim().toUpperCase();
  const workerCodeNorm = workerCode.trim().toUpperCase();
  return (
    db.submissions.find(
      (s) =>
        s.evaluationCode.toUpperCase() === evalCodeNorm &&
        s.workerCode.toUpperCase() === workerCodeNorm
    ) || null
  );
}

export async function saveSubmission(submission: WorkerSubmission): Promise<WorkerSubmission> {
  const db = await getDatabase();
  const index = db.submissions.findIndex(
    (s) =>
      s.id === submission.id ||
      (s.evaluationCode.toUpperCase() === submission.evaluationCode.toUpperCase() &&
        s.workerCode.toUpperCase() === submission.workerCode.toUpperCase())
  );

  submission.updatedAt = getEcuadorISOString();

  if (index >= 0) {
    db.submissions[index] = submission;
  } else {
    db.submissions.unshift(submission);
  }

  // Update submission count on campaign if completed
  if (submission.status === 'completed') {
    const campaign = db.campaigns.find(
      (c) => c.code.toUpperCase() === submission.evaluationCode.toUpperCase()
    );
    if (campaign) {
      const completedCount = db.submissions.filter(
        (s) => s.evaluationCode.toUpperCase() === campaign.code.toUpperCase() && s.status === 'completed'
      ).length;
      campaign.submissionsCount = completedCount;
    }
  }

  await writeToDiskOrBlob(db);
  return submission;
}

export async function resetSubmission(evaluationCode: string, workerCode: string): Promise<WorkerSubmission | null> {
  const db = await getDatabase();
  const index = db.submissions.findIndex(
    (s) =>
      s.evaluationCode.toUpperCase() === evaluationCode.trim().toUpperCase() &&
      s.workerCode.toUpperCase() === workerCode.trim().toUpperCase()
  );
  if (index >= 0) {
    const existing = db.submissions[index];
    const reset: WorkerSubmission = {
      ...existing,
      status: 'in_progress',
      currentFieldIndex: 0,
      currentSectionTitle: '',
      answers: {},
      startedAt: getEcuadorISOString(),
      updatedAt: getEcuadorISOString(),
      completedAt: undefined,
    };
    db.submissions[index] = reset;
    await writeToDiskOrBlob(db);
    return reset;
  }
  return null;
}

export async function clearCampaignSubmissions(
  code: string
): Promise<{ deletedCount: number; campaign: EvaluationCampaign | null }> {
  const db = await getDatabase();
  const norm = code.trim().toUpperCase();
  const campaign = db.campaigns.find((c) => c.code.toUpperCase() === norm) || null;

  const initialCount = db.submissions.length;
  db.submissions = db.submissions.filter((s) => s.evaluationCode.toUpperCase() !== norm);
  const deletedCount = initialCount - db.submissions.length;

  if (campaign) {
    campaign.submissionsCount = 0;
    campaign.visits = 0;
    campaign.updatedAt = getEcuadorISOString();
  }

  await writeToDiskOrBlob(db);
  return { deletedCount, campaign };
}

export async function restoreCampaignSubmissions(
  code: string,
  submissions: WorkerSubmission[]
): Promise<{ restoredCount: number; campaign: EvaluationCampaign | null }> {
  const db = await getDatabase();
  const norm = code.trim().toUpperCase();
  const campaign = db.campaigns.find((c) => c.code.toUpperCase() === norm) || null;

  // Remove current submissions for this campaign to avoid duplications
  db.submissions = db.submissions.filter((s) => s.evaluationCode.toUpperCase() !== norm);

  // Sanitize and link incoming submissions
  const sanitized: WorkerSubmission[] = submissions.map((s, idx) => ({
    id: s.id || `sub-restored-${Date.now()}-${idx + 1}`,
    evaluationCode: norm,
    workerCode: s.workerCode || `TRAB-${idx + 1}`,
    status: s.status === 'completed' || s.status === 'in_progress' ? s.status : 'completed',
    currentFormIndex: s.currentFormIndex ?? 0,
    currentFieldIndex: s.currentFieldIndex ?? 0,
    currentSectionTitle: s.currentSectionTitle || '',
    answers: s.answers || {},
    ip: s.ip || '127.0.0.1',
    userAgent: s.userAgent || 'Respaldo Restaurado',
    startedAt: s.startedAt || getEcuadorISOString(),
    updatedAt: s.updatedAt || getEcuadorISOString(),
    completedAt: s.completedAt || (s.status === 'completed' ? getEcuadorISOString() : undefined),
  }));

  // Add restored submissions
  db.submissions.unshift(...sanitized);

  if (campaign) {
    const completedCount = sanitized.filter((s) => s.status === 'completed').length;
    campaign.submissionsCount = completedCount > 0 ? completedCount : sanitized.length;
    campaign.updatedAt = getEcuadorISOString();
  }

  await writeToDiskOrBlob(db);
  return { restoredCount: sanitized.length, campaign };
}

// Evaluation Groups Operations
export async function getGroups(): Promise<EvaluationGroup[]> {
  const db = await getDatabase();
  return db.groups;
}
