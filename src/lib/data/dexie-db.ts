import Dexie, { type EntityTable } from "dexie";
import { buildSeed } from "./seed";
import type { Campaign, Channel, Creative, InboxItem, Task } from "./types";

// Same table names as the SQL schema. Only indexed fields are listed here;
// every other column is stored as-is. Booleans can't be IndexedDB keys, so
// `processed` / `active` are filtered in memory (the tables are small).
export class SegundoCerebroDB extends Dexie {
  channels!: EntityTable<Channel, "id">;
  inbox_items!: EntityTable<InboxItem, "id">;
  campaigns!: EntityTable<Campaign, "id">;
  creatives!: EntityTable<Creative, "id">;
  tasks!: EntityTable<Task, "id">;

  constructor() {
    super("segundo-cerebro");
    this.version(1).stores({
      channels: "id, user_id, &[user_id+name]",
      inbox_items: "id, user_id, created_at",
      campaigns: "id, user_id, status, channel_id",
      creatives: "id, user_id, status, due_date, campaign_id",
      tasks: "id, user_id, status, due_date, channel_id, campaign_id, creative_id, inbox_item_id",
    });

    // Runs once, when the database is first created on this device.
    this.on("populate", async (tx) => {
      const seed = buildSeed(new Date());
      await tx.table("channels").bulkAdd(seed.channels);
      await tx.table("campaigns").bulkAdd(seed.campaigns);
      await tx.table("creatives").bulkAdd(seed.creatives);
      await tx.table("tasks").bulkAdd(seed.tasks);
      await tx.table("inbox_items").bulkAdd(seed.inbox_items);
    });
  }
}

let instance: SegundoCerebroDB | null = null;

/** Lazily created so importing this module during server rendering is harmless. */
export function getDb(): SegundoCerebroDB {
  instance ??= new SegundoCerebroDB();
  return instance;
}
