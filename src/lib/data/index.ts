// The ONLY entry point to data for the rest of the app.
// To switch to Supabase later, change the implementation below and nothing else.
import { dexieRepository } from "./dexie-repository";
import type { Repository } from "./repository";

export const repo: Repository = dexieRepository;

export type * from "./types";
export type * from "./repository";
export {
  CAMPAIGN_STATUSES,
  CREATIVE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./types";
export { CURRENT_USER_ID } from "./current-user";
