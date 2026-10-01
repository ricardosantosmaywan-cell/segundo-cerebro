import { newId } from "@/lib/ids";
import { CURRENT_USER_ID } from "./current-user";
import { getDb } from "./dexie-db";
import type {
  CampaignFilter,
  CreativeFilter,
  InboxFilter,
  Repository,
  TaskFilter,
} from "./repository";
import type { Campaign, Creative, InboxItem, Task } from "./types";

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function nowIso() {
  return new Date().toISOString();
}

function asArray<T>(v: T | T[] | undefined): T[] | undefined {
  return v === undefined ? undefined : Array.isArray(v) ? v : [v];
}

function byCreatedDesc(a: { created_at: string }, b: { created_at: string }) {
  return b.created_at.localeCompare(a.created_at);
}

/** Null due dates last, then earliest first. */
function byDueAsc(a: { due_date: string | null }, b: { due_date: string | null }) {
  if (a.due_date === b.due_date) return 0;
  if (a.due_date === null) return 1;
  if (b.due_date === null) return -1;
  return a.due_date.localeCompare(b.due_date);
}

function mine<T extends { user_id: string }>(row: T) {
  return row.user_id === CURRENT_USER_ID;
}

/** Mirrors the SQL trigger set_task_completed_at(). */
function withCompletedAt(prev: Task, next: Task, ts: string): Task {
  if (next.status === "feito" && prev.status !== "feito") return { ...next, completed_at: ts };
  if (next.status !== "feito") return { ...next, completed_at: null };
  return next;
}

async function inboxRows(filter: InboxFilter = {}) {
  const processed = filter.processed ?? false;
  return getDb()
    .inbox_items.filter((i) => mine(i) && i.processed === processed)
    .toArray();
}

export const dexieRepository: Repository = {
  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // ---------- Channels ----------
  async listChannels() {
    const rows = await getDb().channels.filter(mine).toArray();
    return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  // ---------- Inbox ----------
  async listInboxItems(filter) {
    return (await inboxRows(filter)).sort(byCreatedDesc);
  },

  async countInboxItems(filter) {
    return (await inboxRows(filter)).length;
  },

  async createInboxItem(input) {
    const ts = nowIso();
    const item: InboxItem = {
      id: newId(),
      user_id: CURRENT_USER_ID,
      source: null,
      processed: false,
      ...input,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().inbox_items.add(item);
    notify();
    return item;
  },

  async processInboxItem(id, triage) {
    const db = getDb();
    const result = await db.transaction("rw", db.inbox_items, db.tasks, db.creatives, async () => {
      const item = await db.inbox_items.get(id);
      if (!item) throw new Error(`Item da inbox não encontrado: ${id}`);
      const ts = nowIso();
      const common = { id: newId(), user_id: CURRENT_USER_ID, created_at: ts, updated_at: ts };

      let created: Task | Creative;
      if (triage.kind === "task") {
        const task: Task = {
          title: item.content,
          status: "a_fazer",
          priority: "media",
          due_date: null,
          recurrence: null,
          channel_id: null,
          campaign_id: null,
          creative_id: null,
          ...triage.task,
          ...common,
          inbox_item_id: item.id,
          completed_at: null,
        };
        await db.tasks.add(task);
        created = task;
      } else {
        const creative: Creative = {
          title: item.content,
          campaign_id: null,
          format: null,
          hypothesis: null,
          status: "ideia",
          due_date: null,
          file_url: null,
          result_notes: null,
          ...triage.creative,
          ...common,
        };
        await db.creatives.add(creative);
        created = creative;
      }

      await db.inbox_items.update(id, { processed: true, updated_at: ts });
      return created;
    });
    notify();
    return result;
  },

  async deleteInboxItem(id) {
    const db = getDb();
    await db.transaction("rw", db.inbox_items, db.tasks, async () => {
      // on delete set null
      await db.tasks.where("inbox_item_id").equals(id).modify({ inbox_item_id: null });
      await db.inbox_items.delete(id);
    });
    notify();
  },

  // ---------- Campaigns ----------
  async listCampaigns(filter: CampaignFilter = {}) {
    const statuses = asArray(filter.status);
    const rows = await getDb()
      .campaigns.filter((c) => mine(c) && (!statuses || statuses.includes(c.status)))
      .toArray();
    return rows.sort(byCreatedDesc);
  },

  async createCampaign(input) {
    const ts = nowIso();
    const campaign: Campaign = {
      id: newId(),
      user_id: CURRENT_USER_ID,
      channel_id: null,
      objective: null,
      status: "planeada",
      daily_budget: null,
      start_date: null,
      end_date: null,
      audience: null,
      notes: null,
      ...input,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().campaigns.add(campaign);
    notify();
    return campaign;
  },

  async updateCampaign(id, patch) {
    const db = getDb();
    const prev = await db.campaigns.get(id);
    if (!prev) throw new Error(`Campanha não encontrada: ${id}`);
    const next: Campaign = { ...prev, ...patch, id, updated_at: nowIso() };
    await db.campaigns.put(next);
    notify();
    return next;
  },

  // ---------- Creatives ----------
  async listCreatives(filter: CreativeFilter = {}) {
    const statuses = asArray(filter.status);
    const rows = await getDb()
      .creatives.filter(
        (c) =>
          mine(c) &&
          (!filter.campaign_id || c.campaign_id === filter.campaign_id) &&
          (!statuses || statuses.includes(c.status)),
      )
      .toArray();
    return rows.sort(byDueAsc);
  },

  async createCreative(input) {
    const ts = nowIso();
    const creative: Creative = {
      id: newId(),
      user_id: CURRENT_USER_ID,
      campaign_id: null,
      format: null,
      hypothesis: null,
      status: "ideia",
      due_date: null,
      file_url: null,
      result_notes: null,
      ...input,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().creatives.add(creative);
    notify();
    return creative;
  },

  async updateCreative(id, patch) {
    const db = getDb();
    const prev = await db.creatives.get(id);
    if (!prev) throw new Error(`Criativo não encontrado: ${id}`);
    const next: Creative = { ...prev, ...patch, id, updated_at: nowIso() };
    await db.creatives.put(next);
    notify();
    return next;
  },

  async updateCreativeStatus(id, status) {
    return dexieRepository.updateCreative(id, { status });
  },

  // ---------- Tasks ----------
  async listTasks(filter: TaskFilter = {}) {
    const statuses = asArray(filter.status);
    const limit = filter.due_on_or_before;
    const rows = await getDb()
      .tasks.filter(
        (t) =>
          mine(t) &&
          (!statuses || statuses.includes(t.status)) &&
          (!limit || (t.due_date !== null && t.due_date <= limit)),
      )
      .toArray();
    return rows.sort(byDueAsc);
  },

  async createTask(input) {
    const ts = nowIso();
    const draft: Task = {
      id: newId(),
      user_id: CURRENT_USER_ID,
      status: "a_fazer",
      priority: "media",
      due_date: null,
      recurrence: null,
      channel_id: null,
      campaign_id: null,
      creative_id: null,
      inbox_item_id: null,
      ...input,
      completed_at: null,
      created_at: ts,
      updated_at: ts,
    };
    // The SQL trigger only runs on update; set completed_at here so a task
    // created as 'feito' is still consistent.
    const task = draft.status === "feito" ? { ...draft, completed_at: ts } : draft;
    await getDb().tasks.add(task);
    notify();
    return task;
  },

  async updateTask(id, patch) {
    const db = getDb();
    const prev = await db.tasks.get(id);
    if (!prev) throw new Error(`Tarefa não encontrada: ${id}`);
    const ts = nowIso();
    const next = withCompletedAt(prev, { ...prev, ...patch, id, updated_at: ts }, ts);
    await db.tasks.put(next);
    notify();
    return next;
  },

  async deleteTask(id) {
    await getDb().tasks.delete(id);
    notify();
  },
};
