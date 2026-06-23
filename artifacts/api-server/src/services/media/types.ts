import { z } from "zod";

export type MediaProviderId = "elevenlabs" | "descript" | "gamma" | "canva";
export type MediaJobType = "voice" | "deck";
export type MediaJobStatus = "queued" | "running" | "completed" | "failed";

export const MediaJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

export type ProviderErrorCode =
  | "missing_key"
  | "provider_timeout"
  | "provider_request_failed"
  | "invalid_response"
  | "provider_not_available"
  | "fallback_exhausted";

export interface ProviderErrorContext {
  code: ProviderErrorCode;
  provider: MediaProviderId;
  message: string;
  cause?: unknown;
}

export class MediaProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly provider: MediaProviderId;
  readonly causeData?: unknown;

  constructor({ code, provider, message, cause }: ProviderErrorContext) {
    super(`${provider}: ${message}`);
    this.name = "MediaProviderError";
    this.code = code;
    this.provider = provider;
    this.causeData = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
}

export interface DeckSection {
  title: string;
  facts: string[];
}

export interface DeckSummary {
  title: string;
  sections: DeckSection[];
}

export interface VoiceCatalogItem {
  id: string;
  name: string;
  language: string;
  gender?: string | null;
  provider: MediaProviderId;
}

export interface VoiceGenerationRequest {
  dinoId?: string | null;
  script: string;
  voiceId?: string;
  speed?: number;
  provider?: string;
}

export interface DeckGenerationRequest {
  dinoId?: string | null;
  content: string;
  style?: string;
  provider?: string;
}

export interface MediaVoiceJobAsset {
  kind: "voice";
  provider: MediaProviderId;
  audioUrl: string;
  transcript: string;
  subtitles?: SubtitleCue[];
  durationMs?: number;
}

export interface MediaDeckJobAsset {
  kind: "deck";
  provider: MediaProviderId;
  title: string;
  previewUrl: string;
  shareUrl?: string;
  canvaEditableUrl?: string;
  importText?: string;
  summary?: DeckSummary;
}

export type MediaJobAsset = MediaVoiceJobAsset | MediaDeckJobAsset;

export interface MediaJobRecord {
  id: string;
  type: MediaJobType;
  status: MediaJobStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  dinoId?: string | null;
  provider?: string | null;
  request: VoiceGenerationRequest | DeckGenerationRequest;
  errorCode?: string | null;
  errorMessage?: string | null;
  asset?: MediaJobAsset | null;
}

export interface VoiceProvider {
  readonly id: MediaProviderId;
  readonly displayName: string;
  generateSpeech(
    request: VoiceGenerationRequest & { requestId: string },
    timeoutMs?: number,
  ): Promise<MediaVoiceJobAsset>;
  listVoices(timeoutMs?: number): Promise<VoiceCatalogItem[]>;
}

export interface DeckProvider {
  readonly id: MediaProviderId;
  readonly displayName: string;
  generateDeck(
    request: DeckGenerationRequest & { requestId: string; dinoTitle?: string | null },
    timeoutMs?: number,
  ): Promise<MediaDeckJobAsset>;
}

export interface CanvableDeckProvider extends DeckProvider {
  generateCanvaVariant(
    request: DeckGenerationRequest & { requestId: string; dinoTitle?: string | null },
    timeoutMs?: number,
  ): Promise<MediaDeckJobAsset>;
}
