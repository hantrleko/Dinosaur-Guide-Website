import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, hasDatabase, mediaJobs, mediaAssets, dinoAudioAssets, dinoDeckAssets } from "@workspace/db";
import { logger } from "../lib/logger";
import type {
  MediaJobAsset,
  MediaJobRecord,
  MediaJobStatus,
  MediaJobType,
} from "./types";

type JobPayload = MediaJobRecord["request"];

export interface StoredJob extends MediaJobRecord {
  request: JobPayload;
}

const memoryStore = new Map<string, StoredJob>();

function toNowString() {
  return new Date().toISOString();
}

function normalizeAsset(payload: unknown): MediaJobAsset | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const candidate = payload as {
    kind?: unknown;
    provider?: unknown;
  };

  if (candidate.kind !== "voice" && candidate.kind !== "deck") {
    return undefined;
  }

  if (typeof candidate.provider !== "string") {
    return undefined;
  }

  return payload as MediaJobAsset;
}

async function getLatestAssetForJobId(
  jobId: string,
): Promise<MediaJobAsset | undefined> {
  if (!hasDatabase || !db) {
    return undefined;
  }

  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.jobId, jobId))
    .orderBy(desc(mediaAssets.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return undefined;

  return normalizeAsset(row.metadata);
}

function mapDbRowToJob(row: typeof mediaJobs.$inferSelect | undefined | null, asset?: MediaJobAsset): StoredJob | null {
  if (!row) return null;

  return {
    id: row.id,
    type: row.type as MediaJobType,
    status: row.status as MediaJobStatus,
    progress: row.progress ?? 0,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
    dinoId: row.dinoId ?? null,
    provider: row.provider ?? null,
    request: row.requestPayload as JobPayload,
    asset,
    errorCode: row.errorCode ?? null,
    errorMessage: row.errorMessage ?? null,
  };
}

function mapDbRowToJobSummary(row: typeof mediaJobs.$inferSelect | undefined | null): StoredJob | null {
  return mapDbRowToJob(row, undefined);
}

function cleanFilters<
  T extends Record<string, unknown>,
>(filters: T): T {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null),
  ) as T;
}

function getMemoryJobsByFilter(
  filters?: {
    type?: MediaJobType;
    dinoId?: string;
    status?: MediaJobStatus;
    limit?: number;
  },
) {
  let result = Array.from(memoryStore.values());

  if (filters?.type) {
    result = result.filter((job) => job.type === filters.type);
  }

  if (filters?.dinoId) {
    result = result.filter((job) => job.dinoId === filters.dinoId);
  }

  if (filters?.status) {
    result = result.filter((job) => job.status === filters.status);
  }

  result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filters?.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

async function persistToDb(job: StoredJob) {
  if (!hasDatabase || !db) {
    return;
  }

  await db.insert(mediaJobs).values({
    id: job.id,
    type: job.type,
    status: job.status,
    dinoId: job.dinoId ?? null,
    provider: job.provider ?? null,
    requestPayload: job.request as Record<string, unknown>,
    progress: job.progress,
    errorCode: job.errorCode ?? null,
    errorMessage: job.errorMessage ?? null,
    sourceIp: null,
  });
}

async function persistAssetRow(job: StoredJob, asset: MediaJobAsset): Promise<string | null> {
  if (!hasDatabase || !db) {
    return null;
  }

  const assetId = randomUUID();
  await db.insert(mediaAssets).values({
    id: assetId,
    jobId: job.id,
    kind: asset.kind,
    provider: asset.provider,
    url: asset.kind === "deck" ? (asset.previewUrl || asset.importText || "") : asset.audioUrl,
    metadata: asset as Record<string, unknown>,
  });

  if (job.dinoId) {
    if (asset.kind === "voice") {
      await db.insert(dinoAudioAssets).values({
        id: randomUUID(),
        dinoId: job.dinoId,
        mediaAssetId: assetId,
      });
    } else {
      await db.insert(dinoDeckAssets).values({
        id: randomUUID(),
        dinoId: job.dinoId,
        mediaAssetId: assetId,
      });
    }
  }

  return assetId;
}

export async function createMediaJob(record: Omit<StoredJob, "createdAt" | "updatedAt">): Promise<StoredJob> {
  const now = toNowString();
  const job: StoredJob = {
    ...record,
    createdAt: now,
    updatedAt: now,
  };

  memoryStore.set(job.id, job);
  await persistToDb(job);

  return job;
}

export async function updateMediaJob(
  id: string,
  update: Partial<Omit<StoredJob, "id" | "type">>,
): Promise<StoredJob | null> {
  const cached = memoryStore.get(id);
  const now = toNowString();

  const updated: StoredJob | null = cached
    ? {
        ...cached,
        ...update,
        id,
        updatedAt: now,
      }
    : null;

  if (updated) {
    memoryStore.set(id, updated);
  }

  if (!hasDatabase || !db || !cached) {
    if (!cached) {
      return getMediaJob(id);
    }
    return updated;
  }

  try {
    await db
      .update(mediaJobs)
      .set({
        status: updated?.status,
        provider: updated?.provider ?? null,
        progress: updated?.progress,
        updatedAt: now,
        errorCode: updated?.errorCode ?? null,
        errorMessage: updated?.errorMessage ?? null,
        requestPayload: (updated?.request as Record<string, unknown>) ?? {},
      })
      .where(eq(mediaJobs.id, id));
  } catch (error) {
    logger.warn(
      { err: error },
      "db update mediaJobs failed, continue with memory store",
    );
  }

  if (!cached) {
    return getMediaJob(id);
  }

  if (updated && updated.status === "completed" && updated.asset) {
    await persistAssetRow(updated, updated.asset).catch((error) => {
      logger.warn(
        { err: error, jobId: id },
        "db insert mediaAssets failed, continue with memory store",
      );
    });
  }

  return updated;
}

export async function getMediaJob(id: string): Promise<StoredJob | null> {
  const cached = memoryStore.get(id);
  if (cached) {
    return cached;
  }

  if (!hasDatabase || !db) {
    return null;
  }

  const result = await db
    .select()
    .from(mediaJobs)
    .where(eq(mediaJobs.id, id))
    .orderBy(desc(mediaJobs.createdAt))
    .limit(1);

  const row = result[0];
  if (!row) {
    return null;
  }

  const asset = await getLatestAssetForJobId(id);
  const mapped = mapDbRowToJob(row, asset);
  if (!mapped) {
    return null;
  }
  memoryStore.set(id, mapped);
  return mapped;
}

export async function listMediaJobs(
  filters?: {
    type?: MediaJobType;
    dinoId?: string;
    status?: MediaJobStatus;
    limit?: number;
  },
): Promise<StoredJob[]> {
  const limit = Math.min(filters?.limit && Number.isFinite(filters.limit) ? filters.limit : 50, 200);

  if (!hasDatabase || !db) {
    return getMemoryJobsByFilter(filters).slice(0, limit);
  }

  const normalizedFilters = cleanFilters({
    type: filters?.type,
    dinoId: filters?.dinoId,
    status: filters?.status,
  });

  const whereClause = Object.keys(normalizedFilters).length > 0
    ? and(
        ...Object.entries(normalizedFilters).map(([key, value]) => {
          if (key === "type") {
            return eq(mediaJobs.type, value as MediaJobType);
          }
          if (key === "dinoId") {
            return eq(mediaJobs.dinoId, value as string);
          }
          return eq(mediaJobs.status, value as MediaJobStatus);
        }),
      )
    : undefined;

  const query = whereClause
    ? db.select().from(mediaJobs).where(whereClause).orderBy(desc(mediaJobs.createdAt))
    : db.select().from(mediaJobs).orderBy(desc(mediaJobs.createdAt));

  const rows = await query.limit(limit);
  const mapped = rows
    .map((row) => mapDbRowToJobSummary(row))
    .filter((job): job is StoredJob => job !== null);

  if (mapped.length > 0) {
    mapped.forEach((job) => {
      memoryStore.set(job.id, job);
    });
    return mapped;
  }

  return getMemoryJobsByFilter(filters).slice(0, limit);
}

export async function markJobFailed(id: string, errorCode: string, errorMessage: string, provider?: string): Promise<StoredJob | null> {
  return updateMediaJob(id, {
    status: "failed",
    progress: 100,
    errorCode,
    errorMessage,
    provider: provider ?? undefined,
    asset: undefined,
  });
}

export function ensureNewJobId() {
  return randomUUID();
}
