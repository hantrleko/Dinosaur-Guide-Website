import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const mediaJobStatusEnum = pgEnum("media_job_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const mediaJobTypeEnum = pgEnum("media_job_type", ["voice", "deck"]);

export const mediaJobs = pgTable(
  "media_jobs",
  {
    id: text("id").primaryKey(),
    type: mediaJobTypeEnum("type").notNull(),
    status: mediaJobStatusEnum("status").notNull().default("queued"),
    dinoId: text("dino_id"),
    provider: text("provider"),
    requestPayload: jsonb("request_payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    progress: integer("progress").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    sourceIp: text("source_ip"),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("media_jobs_created_at_idx").on(table.createdAt),
    index("media_jobs_status_idx").on(table.status),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => mediaJobs.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    provider: text("provider").notNull(),
    url: text("url").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("media_assets_job_id_idx").on(table.jobId),
    index("media_assets_provider_idx").on(table.provider),
  ],
);

export const dinoAudioAssets = pgTable(
  "dino_audio_assets",
  {
    id: text("id").primaryKey(),
    dinoId: text("dino_id").notNull(),
    mediaAssetId: text("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("dino_audio_assets_dino_id_idx").on(table.dinoId),
    index("dino_audio_assets_asset_id_idx").on(table.mediaAssetId),
  ],
);

export const dinoDeckAssets = pgTable(
  "dino_deck_assets",
  {
    id: text("id").primaryKey(),
    dinoId: text("dino_id").notNull(),
    mediaAssetId: text("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("dino_deck_assets_dino_id_idx").on(table.dinoId),
    index("dino_deck_assets_asset_id_idx").on(table.mediaAssetId),
  ],
);

export type MediaJobRow = typeof mediaJobs.$inferSelect;
export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type DinoAudioAssetRow = typeof dinoAudioAssets.$inferSelect;
export type DinoDeckAssetRow = typeof dinoDeckAssets.$inferSelect;
