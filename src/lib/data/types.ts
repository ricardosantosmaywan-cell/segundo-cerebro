// Mirrors supabase/migrations/001_fase1_schema.sql exactly.
// Keep field names in snake_case and in the same order as the SQL.
// uuid → string, timestamptz → ISO string, date → "YYYY-MM-DD", numeric → number.

export type UUID = string;
/** ISO 8601 timestamp, e.g. "2026-10-01T09:30:00.000Z" (SQL timestamptz). */
export type Timestamp = string;
/** Calendar date "YYYY-MM-DD" (SQL date). */
export type DateOnly = string;

// ---------- Enums ----------
export const CAMPAIGN_STATUSES = ["planeada", "em_teste", "ativa", "pausada", "encerrada"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CREATIVE_STATUSES = ["ideia", "em_producao", "pronto", "no_ar", "esgotado"] as const;
export type CreativeStatus = (typeof CREATIVE_STATUSES)[number];

export const TASK_STATUSES = ["a_fazer", "em_curso", "feito"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["baixa", "media", "alta"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// ---------- Tables ----------
export interface Channel {
  id: UUID;
  user_id: UUID;
  name: string;
  area: string;
  objective: string | null;
  routine: string | null;
  active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface InboxItem {
  id: UUID;
  user_id: UUID;
  content: string;
  source: string | null;
  processed: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Campaign {
  id: UUID;
  user_id: UUID;
  channel_id: UUID | null;
  name: string;
  objective: string | null;
  status: CampaignStatus;
  daily_budget: number | null;
  start_date: DateOnly | null;
  end_date: DateOnly | null;
  audience: string | null;
  notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Creative {
  id: UUID;
  user_id: UUID;
  campaign_id: UUID | null;
  title: string;
  format: string | null;
  hypothesis: string | null;
  status: CreativeStatus;
  due_date: DateOnly | null;
  file_url: string | null;
  result_notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Task {
  id: UUID;
  user_id: UUID;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: DateOnly | null;
  recurrence: string | null;
  channel_id: UUID | null;
  campaign_id: UUID | null;
  creative_id: UUID | null;
  inbox_item_id: UUID | null;
  completed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ---------- Inputs ----------
// Fields with a SQL default (id, user_id, timestamps, status, ...) are optional on insert.
type ServerManaged = "id" | "user_id" | "created_at" | "updated_at";
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NewChannel = Optional<
  Omit<Channel, ServerManaged>,
  "area" | "objective" | "routine" | "active"
>;
export type NewInboxItem = Optional<Omit<InboxItem, ServerManaged>, "source" | "processed">;
export type NewCampaign = Optional<
  Omit<Campaign, ServerManaged>,
  | "channel_id"
  | "objective"
  | "status"
  | "daily_budget"
  | "start_date"
  | "end_date"
  | "audience"
  | "notes"
>;
export type NewCreative = Optional<
  Omit<Creative, ServerManaged>,
  "campaign_id" | "format" | "hypothesis" | "status" | "due_date" | "file_url" | "result_notes"
>;
export type NewTask = Optional<
  Omit<Task, ServerManaged | "completed_at">,
  | "status"
  | "priority"
  | "due_date"
  | "recurrence"
  | "channel_id"
  | "campaign_id"
  | "creative_id"
  | "inbox_item_id"
>;

export type CampaignPatch = Partial<Omit<Campaign, ServerManaged>>;
export type CreativePatch = Partial<Omit<Creative, ServerManaged>>;
export type TaskPatch = Partial<Omit<Task, ServerManaged | "completed_at">>;

/** What an inbox item becomes during triage. */
export type InboxTriage =
  | { kind: "task"; task?: Partial<NewTask> }
  | { kind: "creative"; creative?: Partial<NewCreative> };
