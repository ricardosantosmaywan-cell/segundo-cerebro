import type {
  Campaign,
  CampaignPatch,
  CampaignStatus,
  Channel,
  Creative,
  CreativePatch,
  CreativeStatus,
  InboxItem,
  InboxTriage,
  NewCampaign,
  NewCreative,
  NewInboxItem,
  NewTask,
  Task,
  TaskPatch,
  TaskStatus,
  UUID,
} from "./types";

export interface InboxFilter {
  /** Default: false (only items still waiting for triage). */
  processed?: boolean;
}

export interface CampaignFilter {
  status?: CampaignStatus | CampaignStatus[];
}

export interface CreativeFilter {
  campaign_id?: UUID;
  status?: CreativeStatus | CreativeStatus[];
}

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  channel_id?: UUID;
  campaign_id?: UUID;
  creative_id?: UUID;
  /** Inclusive upper bound on due_date ("YYYY-MM-DD"). Tasks without due_date are excluded. */
  due_on_or_before?: string;
}

/**
 * Contract between the screens and whatever stores the data.
 * Every backend (Dexie today, Supabase later) implements this same interface.
 * All methods are async, even when the backend could answer synchronously.
 */
export interface Repository {
  /** Called on every write. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  // Channels
  listChannels(): Promise<Channel[]>;

  // Inbox
  listInboxItems(filter?: InboxFilter): Promise<InboxItem[]>;
  countInboxItems(filter?: InboxFilter): Promise<number>;
  createInboxItem(input: NewInboxItem): Promise<InboxItem>;
  /** Turns an item into a task or a creative and marks it as processed. */
  processInboxItem(id: UUID, triage: InboxTriage): Promise<Task | Creative>;
  deleteInboxItem(id: UUID): Promise<void>;

  // Campaigns
  listCampaigns(filter?: CampaignFilter): Promise<Campaign[]>;
  getCampaign(id: UUID): Promise<Campaign | undefined>;
  createCampaign(input: NewCampaign): Promise<Campaign>;
  updateCampaign(id: UUID, patch: CampaignPatch): Promise<Campaign>;
  /** Linked creatives and tasks keep existing with campaign_id = null (SQL: on delete set null). */
  deleteCampaign(id: UUID): Promise<void>;

  // Creatives
  listCreatives(filter?: CreativeFilter): Promise<Creative[]>;
  getCreative(id: UUID): Promise<Creative | undefined>;
  createCreative(input: NewCreative): Promise<Creative>;
  updateCreative(id: UUID, patch: CreativePatch): Promise<Creative>;
  updateCreativeStatus(id: UUID, status: CreativeStatus): Promise<Creative>;
  /** Tasks linked to it keep existing with creative_id = null (SQL: on delete set null). */
  deleteCreative(id: UUID): Promise<void>;

  // Tasks
  listTasks(filter?: TaskFilter): Promise<Task[]>;
  getTask(id: UUID): Promise<Task | undefined>;
  createTask(input: NewTask): Promise<Task>;
  /** Setting status to/from 'feito' updates completed_at (same as the SQL trigger). */
  updateTask(id: UUID, patch: TaskPatch): Promise<Task>;
  deleteTask(id: UUID): Promise<void>;
}
