/**
 * Manual sync from ApiSpec (api-spec/openapi.yaml) until dependency installs are available.
 * Do not hand-edit in normal conditions; this file mirrors expected Orval outputs.
 */
import { z } from "zod";

export const HealthCheckResponse = z.object({
  status: z.string(),
});

export const ErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).nullable().optional(),
});

export const HealthStatus = HealthCheckResponse;

export const DinoId = z.string();

export const DinoEra = z.enum(["三叠纪", "侏罗纪", "白垩纪"]);

export const DinoDiet = z.enum(["肉食", "草食", "杂食"]);

export const Dinosaur = z.object({
  id: z.string(),
  nameCn: z.string(),
  nameLatin: z.string(),
  era: DinoEra,
  diet: DinoDiet,
  lengthM: z.number(),
  weightTons: z.number(),
  region: z.string(),
  description: z.string(),
  funFact: z.string(),
  imageUrl: z.string(),
});

export const DinoListResponse = z.object({
  items: z.array(Dinosaur),
});

export const VoiceCatalogItem = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.string().nullable().optional(),
  language: z.string(),
  provider: z.string(),
});

export const VoiceCatalogResponse = z.object({
  voices: z.array(VoiceCatalogItem),
});

export const MediaJobStatus = z.enum(["queued", "running", "completed", "failed"]);

export const MediaJobType = z.enum(["voice", "deck"]);

export const SubtitleCue = z.object({
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().nonnegative(),
  text: z.string(),
});

export const DeckSection = z.object({
  title: z.string(),
  facts: z.array(z.string()),
});

export const DeckSummary = z.object({
  title: z.string(),
  sections: z.array(DeckSection),
});

export const VoiceGenerationRequest = z.object({
  dinoId: z.string().nullable().optional(),
  script: z.string().min(20).max(4000),
  voiceId: z.string().optional(),
  speed: z.number().min(0.6).max(2).optional(),
  provider: z.string().optional(),
});

export const DeckGenerationRequest = z.object({
  dinoId: z.string().nullable().optional(),
  content: z.string().min(30).max(5000),
  style: z.string().optional(),
  provider: z.string().optional(),
});

export const VoiceJobAsset = z.object({
  provider: z.string(),
  kind: z.literal("voice"),
  audioUrl: z.string(),
  transcript: z.string(),
  subtitles: z.array(SubtitleCue).optional(),
  durationMs: z.number().int().positive().optional(),
});

export const DeckJobAsset = z.object({
  provider: z.string(),
  kind: z.literal("deck"),
  title: z.string(),
  previewUrl: z.string(),
  shareUrl: z.string().optional(),
  canvaEditableUrl: z.string().optional(),
  importText: z.string().optional(),
  summary: DeckSummary.optional(),
});

export const MediaVoiceJob = z.object({
  id: z.string(),
  type: z.literal("voice"),
  status: MediaJobStatus,
  progress: z.number().int().min(0).max(100),
  dinoId: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  request: VoiceGenerationRequest,
  asset: VoiceJobAsset.nullable().optional(),
});

export const MediaDeckJob = z.object({
  id: z.string(),
  type: z.literal("deck"),
  status: MediaJobStatus,
  progress: z.number().int().min(0).max(100),
  dinoId: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  request: DeckGenerationRequest,
  asset: DeckJobAsset.nullable().optional(),
});

export const MediaJobSummary = z.object({
  id: z.string(),
  type: MediaJobType,
  status: MediaJobStatus,
  progress: z.number().int().min(0).max(100),
  dinoId: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export const MediaJobListResponse = z.object({
  items: z.array(MediaJobSummary),
});

export type HealthStatus = z.infer<typeof HealthStatus>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;
export type ErrorResponse = z.infer<typeof ErrorResponse>;
export type DinoEra = z.infer<typeof DinoEra>;
export type DinoDiet = z.infer<typeof DinoDiet>;
export type Dinosaur = z.infer<typeof Dinosaur>;
export type DinoListResponse = z.infer<typeof DinoListResponse>;
export type VoiceCatalogItem = z.infer<typeof VoiceCatalogItem>;
export type VoiceCatalogResponse = z.infer<typeof VoiceCatalogResponse>;
export type MediaJobStatus = z.infer<typeof MediaJobStatus>;
export type MediaJobType = z.infer<typeof MediaJobType>;
export type SubtitleCue = z.infer<typeof SubtitleCue>;
export type DeckSection = z.infer<typeof DeckSection>;
export type DeckSummary = z.infer<typeof DeckSummary>;
export type VoiceGenerationRequest = z.infer<typeof VoiceGenerationRequest>;
export type DeckGenerationRequest = z.infer<typeof DeckGenerationRequest>;
export type VoiceJobAsset = z.infer<typeof VoiceJobAsset>;
export type DeckJobAsset = z.infer<typeof DeckJobAsset>;
export type MediaVoiceJob = z.infer<typeof MediaVoiceJob>;
export type MediaDeckJob = z.infer<typeof MediaDeckJob>;
export type MediaJobSummary = z.infer<typeof MediaJobSummary>;
export type MediaJobListResponse = z.infer<typeof MediaJobListResponse>;
