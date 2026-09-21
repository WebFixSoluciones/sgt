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

// In-memory cache for speed
let memDb: DatabaseSchema | null = null;

function getInitialDb(): DatabaseSchema {
  return {
    forms: initialForms,
    campaigns: initialCampaigns,
    submissions: initialSubmissions,
    groups: initialGroups,
  };
}

async function readFromDiskOrBlob(): Promise<DatabaseSchema> {
  // Check if Vercel Blob is configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob');
      const blobs = await list({ prefix: 'db.json' });
      if (blobs.blobs.length > 0) {
        const response = await fetch(blobs.blobs[0].url, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      }
    } catch (e) {
      console.warn('Vercel Blob read error, falling back to local/tmp:', e);
    }
  }

  // Filesystem fallback (uses /tmp on Vercel/serverless)
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
    console.error('Error reading DB:', err);
    return getInitialDb();
  }
}

async function writeToDiskOrBlob(db: DatabaseSchema): Promise<void> {
  memDb = db;

  // Local write
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to local file (read-only environment):', e);
  }

  // Vercel Blob write if token exists
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      await put('db.json', JSON.stringify(db, null, 2), {
        access: 'public',
        addRandomSuffix: false,
      });
    } catch (e) {
      console.error('Error writing to Vercel Blob:', e);
    }
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  if (!memDb) {
    memDb = await readFromDiskOrBlob();
  }
  return memDb;
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

// Evaluation Groups Operations
export async function getGroups(): Promise<EvaluationGroup[]> {
  const db = await getDatabase();
  return db.groups;
}
