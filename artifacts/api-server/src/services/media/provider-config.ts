import type { MediaProviderId } from "./types";

const defaultVoicePriority: ReadonlyArray<MediaProviderId> = [
  "elevenlabs",
  "descript",
];
const defaultDeckPriority: ReadonlyArray<MediaProviderId> = ["gamma", "canva"];

function parsePriority(raw: string, fallback: ReadonlyArray<MediaProviderId>): MediaProviderId[] {
  const known = new Set<MediaProviderId>(["elevenlabs", "descript", "gamma", "canva"]);
  const parsed = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .filter((item): item is MediaProviderId => known.has(item as MediaProviderId));

  return parsed.length > 0 ? parsed : [...fallback];
}

function parseNumber(raw: string | undefined, fallback: number) {
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const mediaConfig = {
  voicePriority: parsePriority(
    process.env.MEDIA_VOICE_PROVIDER_PRIORITY ??
      process.env.MEDIA_PROVIDER_PRIORITY ??
      defaultVoicePriority.join(","),
    defaultVoicePriority,
  ),
  deckPriority: parsePriority(
    process.env.MEDIA_DECK_PROVIDER_PRIORITY ??
      process.env.MEDIA_PROVIDER_PRIORITY ??
      defaultDeckPriority.join(","),
    defaultDeckPriority,
  ),
  fallbackTimeoutMs: parseNumber(
    process.env.MEDIA_PROVIDER_FALLBACK_TIMEOUT_MS ??
      process.env.MEDIA_FALLBACK_TIMEOUT_MS,
    10_000,
  ),
  providerRetryAttempts: parseNumber(
    process.env.MEDIA_PROVIDER_RETRY_ATTEMPTS ??
      process.env.MEDIA_RETRY_ATTEMPTS,
    1,
  ),
  idempotencyTtlMs: parseNumber(process.env.MEDIA_IDEMPOTENCY_TTL_MS, 30 * 60_000),
  rateLimitWindowMs: parseNumber(process.env.MEDIA_RATE_WINDOW_MS, 30_000),
  rateLimitMaxRequests: parseNumber(process.env.MEDIA_RATE_MAX_REQUESTS, 30),
};
