import { createHash } from "node:crypto";
import { dinosaurs } from "../data/dinosaurs";
import { logger } from "../lib/logger";
import { mediaConfig } from "./provider-config";
import {
  MediaProviderError,
  type DeckGenerationRequest,
  type MediaJobRecord,
  type MediaJobStatus,
  type MediaJobType,
  type MediaProviderId,
  type VoiceGenerationRequest,
  type VoiceCatalogItem,
} from "./types";
import {
  createMediaJob,
  getMediaJob,
  listMediaJobs,
  updateMediaJob,
  ensureNewJobId,
  markJobFailed,
} from "./job-store";
import { canvaProvider } from "./providers/canva";
import { descriptProvider } from "./providers/descript";
import { gammaProvider } from "./providers/gamma";
import { elevenlabsProvider } from "./providers/elevenlabs";
import type { VoiceProvider, DeckProvider, CanvableDeckProvider } from "./types";

const voiceProviders: VoiceProvider[] = [
  {
    id: elevenlabsProvider.id,
    displayName: elevenlabsProvider.displayName,
    generateSpeech: elevenlabsProvider.generateSpeech,
    listVoices: elevenlabsProvider.listVoices,
  },
  {
    id: descriptProvider.id,
    displayName: descriptProvider.displayName,
    generateSpeech: descriptProvider.generateSpeech,
    listVoices: descriptProvider.listVoices,
  },
];

const deckProviders: Array<DeckProvider & Partial<CanvableDeckProvider>> = [
  {
    id: gammaProvider.id,
    displayName: gammaProvider.displayName,
    generateDeck: gammaProvider.generateDeck,
  },
  {
    id: canvaProvider.id,
    displayName: canvaProvider.displayName,
    generateDeck: canvaProvider.generateDeck,
    generateCanvaVariant: canvaProvider.generateCanvaVariant,
  },
];

type InternalMediaType = "voice" | "deck";

interface IdempotentRecord {
  jobId: string;
  type: InternalMediaType;
  bodyHash: string;
  expireAt: number;
}

type SubmitVoiceJobRequest = VoiceGenerationRequest & {
  dinoTitle?: string | null;
  idempotencyKey?: string | null;
};

type SubmitDeckJobRequest = DeckGenerationRequest & {
  dinoTitle?: string | null;
  idempotencyKey?: string | null;
};

const idempotencyStore = new Map<string, IdempotentRecord>();
const RETRY_ATTEMPTS = Math.max(1, mediaConfig.providerRetryAttempts);

function pickProviders<T extends { id: MediaProviderId }>(
  configuredPriority: MediaProviderId[],
  all: T[],
) {
  return configuredPriority
    .map((id) => all.find((provider) => provider.id === id))
    .filter(Boolean) as T[];
}

const voicePriority = pickProviders(mediaConfig.voicePriority, voiceProviders);
const deckPriority = pickProviders(mediaConfig.deckPriority, deckProviders);

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  const timeoutMs = Math.max(1000, mediaConfig.fallbackTimeoutMs);
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`request timeout after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

function chooseVoiceProvider(preferred?: string) {
  if (preferred) {
    const forced = voiceProviders.find(
      (provider) => provider.id === preferred.toLowerCase(),
    );
    if (forced) return [forced];
  }
  return voicePriority;
}

function chooseDeckProvider(preferred?: string) {
  if (preferred) {
    const forced = deckProviders.find(
      (provider) => provider.id === preferred.toLowerCase(),
    );
    if (forced) return [forced];
  }
  return deckPriority;
}

function normalizeError(error: unknown, providerId: MediaProviderId) {
  if (error instanceof MediaProviderError) {
    return error;
  }

  return new MediaProviderError({
    provider: providerId,
    code: "provider_request_failed",
    message: String(error instanceof Error ? error.message : "unknown"),
  });
}

async function withRetry<T>(
  providerId: MediaProviderId,
  operation: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_ATTEMPTS - 1) {
        logger.warn(
          { err: error, provider: providerId, attempt: attempt + 1 },
          `provider ${providerId} attempt ${attempt + 1}/${RETRY_ATTEMPTS} failed, retrying`,
        );
      }
    }
  }

  throw normalizeError(lastError, providerId);
}

function chooseProviderForCatalog() {
  return pickProviders(mediaConfig.voicePriority, voiceProviders);
}

function chooseVoiceRequestKey(type: InternalMediaType, key?: string | null) {
  if (!key || key.trim().length < 4) {
    return null;
  }
  return `${type}:${key.trim()}`;
}

function normalizeIdempotentPayload(request: VoiceGenerationRequest | DeckGenerationRequest) {
  return JSON.stringify({
    dinoId: request.dinoId ?? null,
    script: "script" in request ? request.script : request.content,
    style: "style" in request ? request.style : undefined,
    voiceId: "voiceId" in request ? request.voiceId : undefined,
    provider: request.provider ?? null,
    speed: "speed" in request ? request.speed : undefined,
  });
}

function requestFingerprint(request: VoiceGenerationRequest | DeckGenerationRequest) {
  return createHash("sha256")
    .update(normalizeIdempotentPayload(request))
    .digest("hex");
}

function pruneExpiredIdempotentKeys() {
  const now = Date.now();
  for (const [cacheKey, item] of idempotencyStore.entries()) {
    if (item.expireAt < now) {
      idempotencyStore.delete(cacheKey);
    }
  }
}

function getCachedJobByIdempotency(
  type: InternalMediaType,
  idempotencyKey?: string | null,
  request: VoiceGenerationRequest | DeckGenerationRequest,
) {
  const cacheKey = chooseVoiceRequestKey(type, idempotencyKey);
  if (!cacheKey) {
    return null;
  }

  const cached = idempotencyStore.get(cacheKey);
  if (!cached) return null;
  if (cached.expireAt < Date.now()) {
    idempotencyStore.delete(cacheKey);
    return null;
  }

  const requestHash = requestFingerprint(request);
  if (cached.bodyHash !== requestHash || cached.type !== type) {
    return null;
  }

  return cached;
}

function rememberIdempotentJob(
  type: InternalMediaType,
  idempotencyKey?: string | null,
  request: VoiceGenerationRequest | DeckGenerationRequest,
  jobId: string,
) {
  const cacheKey = chooseVoiceRequestKey(type, idempotencyKey);
  if (!cacheKey) return;

  idempotencyStore.set(cacheKey, {
    type,
    jobId,
    bodyHash: requestFingerprint(request),
    expireAt: Date.now() + Math.max(mediaConfig.idempotencyTtlMs, 10_000),
  });
}

function fallbackScriptFromRequest(
  dinoTitle: string | null,
  requestScript: string,
  requestContent: string,
) {
  if (requestScript && requestScript.trim()) {
    return requestScript;
  }
  if (requestContent && requestContent.trim()) {
    return requestContent;
  }
  return `${dinoTitle ?? "恐龙"} 的基本介绍`;
}

async function runWithVoiceProviders(
  request: VoiceGenerationRequest & { requestId: string; dinoTitle?: string | null },
  preferred?: string,
) {
  const providers = chooseVoiceProvider(preferred);
  let lastError: unknown = null;

  for (const provider of providers) {
    try {
      const asset = await withRetry(provider.id, () =>
        withTimeout(provider.generateSpeech(request, mediaConfig.fallbackTimeoutMs)),
      );
      return { asset, provider: provider.id };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "unknown";
      logger.warn(
        { err: error, provider: provider.id, requestId: request.requestId },
        `voice provider ${provider.id} failed: ${message}`,
      );
    }
  }

  if (lastError instanceof MediaProviderError) {
    throw lastError;
  }

  throw new MediaProviderError({
    provider: (providers[0]?.id as MediaProviderId) ?? "elevenlabs",
    code: "provider_not_available",
    message: lastError instanceof Error ? lastError.message : "all providers failed",
  });
}

async function runWithDeckProviders(
  request: DeckGenerationRequest & { requestId: string; dinoTitle?: string | null },
  preferred?: string,
) {
  const providers = chooseDeckProvider(preferred);
  let lastError: unknown = null;

  for (const provider of providers) {
    try {
      const asset = await withRetry(provider.id, () =>
        withTimeout(provider.generateDeck(request, mediaConfig.fallbackTimeoutMs)),
      );
      return { asset, provider: provider.id };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "unknown";
      logger.warn(
        { err: error, provider: provider.id, requestId: request.requestId },
        `deck provider ${provider.id} failed: ${message}`,
      );
    }
  }

  if (lastError instanceof MediaProviderError) {
    throw lastError;
  }

  throw new MediaProviderError({
    provider: (providers[0]?.id as MediaProviderId) ?? "gamma",
    code: "provider_not_available",
    message: lastError instanceof Error ? lastError.message : "all providers failed",
  });
}

export async function submitVoiceJob(
  request: SubmitVoiceJobRequest,
): Promise<MediaJobRecord> {
  const { idempotencyKey, ...persistableRequest } = request;

  const cached = getCachedJobByIdempotency("voice", request.idempotencyKey, request);
  if (cached) {
    const existing = await getMediaJob(cached.jobId);
    if (existing) return existing;
  }

  const id = ensureNewJobId();
  const script = fallbackScriptFromRequest(request.dinoTitle ?? null, request.script, request.script);

  await createMediaJob({
    id,
    type: "voice" as MediaJobType,
    status: "queued",
    progress: 0,
    dinoId: request.dinoId ?? null,
    provider: null,
    request: {
      ...persistableRequest,
      script,
    },
    errorCode: null,
    errorMessage: null,
  });

  rememberIdempotentJob("voice", request.idempotencyKey, request, id);
  pruneExpiredIdempotentKeys();

  void processVoiceJob(id, request, request.provider).catch((error) => {
    const code =
      error instanceof MediaProviderError ? error.code : "provider_request_failed";
    const message = error instanceof Error ? error.message : "unknown";
    void markJobFailed(id, code, message).catch((persistErr) => {
      logger.warn({ err: persistErr }, "markJobFailed failed");
    });
  });

  return getMediaJob(id) as Promise<MediaJobRecord>;
}

export async function submitDeckJob(
  request: SubmitDeckJobRequest,
): Promise<MediaJobRecord> {
  const { idempotencyKey, ...persistableRequest } = request;

  const cached = getCachedJobByIdempotency("deck", request.idempotencyKey, request);
  if (cached) {
    const existing = await getMediaJob(cached.jobId);
    if (existing) return existing;
  }

  const id = ensureNewJobId();
  const content = fallbackScriptFromRequest(request.dinoTitle ?? null, request.content, request.content);

  await createMediaJob({
    id,
    type: "deck" as MediaJobType,
    status: "queued",
    progress: 0,
    dinoId: request.dinoId ?? null,
    provider: null,
    request: {
      ...persistableRequest,
      content,
    },
    errorCode: null,
    errorMessage: null,
  });

  rememberIdempotentJob("deck", request.idempotencyKey, request, id);
  pruneExpiredIdempotentKeys();

  void processDeckJob(id, request, request.provider).catch((error) => {
    const code =
      error instanceof MediaProviderError ? error.code : "provider_request_failed";
    const message = error instanceof Error ? error.message : "unknown";
    void markJobFailed(id, code, message).catch((persistErr) => {
      logger.warn({ err: persistErr }, "markJobFailed failed");
    });
  });

  return getMediaJob(id) as Promise<MediaJobRecord>;
}

async function processVoiceJob(
  jobId: string,
  request: VoiceGenerationRequest & { dinoTitle?: string | null },
  preferredProvider?: string,
) {
  await updateMediaJob(jobId, { status: "running", progress: 5 });
  const voiceRequest = {
    ...request,
    requestId: jobId,
    dinoTitle: request.dinoTitle ?? null,
  };
  const { asset } = await runWithVoiceProviders(voiceRequest, preferredProvider);
  await updateMediaJob(jobId, {
    status: "completed",
    progress: 100,
    provider: asset.provider,
    asset,
  });
}

async function processDeckJob(
  jobId: string,
  request: DeckGenerationRequest & { dinoTitle?: string | null },
  preferredProvider?: string,
) {
  await updateMediaJob(jobId, { status: "running", progress: 5 });
  const deckRequest = {
    ...request,
    requestId: jobId,
    dinoTitle: request.dinoTitle ?? null,
  };
  const { asset } = await runWithDeckProviders(deckRequest, preferredProvider);
  await updateMediaJob(jobId, {
    status: "completed",
    progress: 100,
    provider: asset.provider,
    asset,
  });
}

export async function listDinosaurs() {
  return dinosaurs;
}

export async function getDinoById(id: string) {
  const dinos = await listDinosaurs();
  return dinos.find((item) => item.id === id) ?? null;
}

export async function getMediaJobById(
  jobId: string,
  expectedType: MediaJobType | null,
) {
  const job = await getMediaJob(jobId);
  if (!job) return null;
  if (expectedType && job.type !== expectedType) return null;
  return job;
}

export async function getVoiceCatalog(): Promise<VoiceCatalogItem[]> {
  const requested: VoiceCatalogItem[] = [];
  const providers = chooseProviderForCatalog();

  for (const provider of providers) {
    try {
      const list = await withTimeout(
        provider.listVoices(mediaConfig.fallbackTimeoutMs),
      );
      requested.push(...list);
    } catch (error) {
      logger.warn(
        { err: error, provider: provider.id },
        `voice catalog provider failed`,
      );
    }
  }

  return requested;
}

export async function getMediaJobs(filters?: {
  type?: MediaJobType;
  dinoId?: string;
  status?: MediaJobStatus;
  limit?: number;
}) {
  return listMediaJobs(filters);
}
