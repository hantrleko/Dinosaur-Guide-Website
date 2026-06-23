import { createHash } from "node:crypto";
import {
  MediaProviderError,
  type MediaProviderId,
  type MediaVoiceJobAsset,
  type VoiceGenerationRequest,
} from "../types";

const providerId: MediaProviderId = "elevenlabs";
const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // Rachel
const apiBase = process.env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io/v1";

function splitToSubtitles(text: string): { startMs: number; endMs: number; text: string }[] {
  const chunks = text
    .split(/([。！？!?;；:：。！？!?.]\s*)/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let cursor = 0;
  return chunks.map((segment) => {
    const durationMs = Math.max(500, Math.round(segment.length * 70));
    const cue = {
      startMs: cursor,
      endMs: cursor + durationMs,
      text: segment,
    };
    cursor += durationMs;
    return cue;
  });
}

function buildFallbackAudio(script: string): string {
  const hash = createHash("sha1").update(script).digest("hex").slice(0, 8);
  return `data:audio/mpeg;base64,${Buffer.from(
    `elevenlabs-fallback-${hash}`,
    "utf8",
  ).toString("base64")}`;
}

async function generateSpeechWithApi(
  request: VoiceGenerationRequest,
): Promise<MediaVoiceJobAsset> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new MediaProviderError({
      provider: providerId,
      code: "missing_key",
      message: "ELEVENLABS_API_KEY is not set",
    });
  }

  const voiceId = request.voiceId?.trim() || defaultVoiceId;
  const response = await fetch(
    `${apiBase}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "accept": "audio/mpeg",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: request.script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
          speed: request.speed ?? 1,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new MediaProviderError({
      provider: providerId,
      code: "provider_request_failed",
      message: `HTTP ${response.status} ${response.statusText}${
        body ? `: ${body.slice(0, 180)}` : ""
      }`,
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 2000) {
    // 避免返回空音频，退回降级
    return {
      kind: "voice",
      provider: providerId,
      audioUrl: buildFallbackAudio(request.script),
      transcript: request.script,
      subtitles: splitToSubtitles(request.script),
    };
  }

  return {
    kind: "voice",
    provider: providerId,
    audioUrl: `data:audio/mpeg;base64,${buffer.toString("base64")}`,
    transcript: request.script,
    subtitles: splitToSubtitles(request.script),
    durationMs: Math.max(500, Math.round(request.script.length * 80)),
  };
}

export const elevenlabsProvider = {
  id: providerId,
  displayName: "ElevenLabs",
  async generateSpeech(request: VoiceGenerationRequest): Promise<MediaVoiceJobAsset> {
    try {
      return await generateSpeechWithApi(request);
    } catch (error) {
      if (error instanceof MediaProviderError) {
        throw error;
      }
      throw new MediaProviderError({
        provider: providerId,
        code: "provider_request_failed",
        message: String(error instanceof Error ? error.message : "unknown"),
      });
    }
  },
  async listVoices(): Promise<{ id: string; name: string; language: string; gender?: string | null; provider: MediaProviderId }[]> {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) {
      return [];
    }

    const response = await fetch(`${apiBase}/voices`, {
      headers: {
        "xi-api-key": key,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json().catch(() => null);
    const voices = Array.isArray((payload as { voices?: unknown })?.voices)
      ? (payload as { voices: Array<Record<string, unknown>> }).voices
      : [];

    return voices
      .map((voice) => {
        const id = typeof voice?.voice_id === "string" ? voice.voice_id : "";
        if (!id) {
          return null;
        }
        return {
          id,
          name:
            typeof voice?.name === "string" ? voice.name : `ElevenLabs-${id}`,
          language:
            typeof voice?.labels === "object" &&
            voice.labels &&
            typeof (voice.labels as Record<string, unknown>)?.language === "string"
              ? ((voice.labels as Record<string, unknown>).language as string)
              : "multi",
          gender:
            typeof voice?.labels === "object" &&
            voice.labels &&
            typeof (voice.labels as Record<string, unknown>)?.gender === "string"
              ? ((voice.labels as Record<string, unknown>).gender as string)
              : null,
          provider: providerId,
        };
      })
      .filter((item): item is {
        id: string;
        name: string;
        language: string;
        gender?: string | null;
        provider: MediaProviderId;
      } => item !== null);
  },
};
