import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DinoInput, StaticAudioTrack } from "./types.ts";
import { splitSubtitles } from "./subtitles.ts";

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}`));
    });
  });
}

async function writeDemoMp3(filePath: string, dino: DinoInput, seed: number) {
  const frequency = 220 + ((seed * 29 + dino.nameLatin.length * 17) % 350);
  await run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=${frequency}:duration=8`,
    "-filter_complex",
    "volume=0.08",
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "6",
    filePath,
  ]);
}

function speechParams(preset: "narration" | "dinoVoice") {
  if (preset === "dinoVoice") {
    return {
      stability: 0.82,
      similarity_boost: 0.95,
      style: 0.5,
      use_speaker_boost: true,
    };
  }

  return {
    stability: 0.52,
    similarity_boost: 0.78,
    style: 0.16,
    use_speaker_boost: true,
  };
}

export async function generateSpeechTrack(params: {
  dino: DinoInput;
  script: string;
  outputDir: string;
  publicBase: string;
  dryRun: boolean;
  trackKey: "narration" | "dinoVoice";
  outputFileName?: string;
  maxSubtitleChars?: number;
}): Promise<StaticAudioTrack> {
  const {
    dino,
    script,
    outputDir,
    publicBase,
    dryRun,
    trackKey,
    outputFileName = trackKey === "narration" ? "narration.mp3" : "dino-voice.mp3",
    maxSubtitleChars = 34,
  } = params;

  const subtitles = splitSubtitles(script, {
    maxChars: maxSubtitleChars,
  });
  await mkdir(outputDir, { recursive: true });

  const subtitlesUrl = `${publicBase}/${
    trackKey === "narration" ? "subtitles.json" : "dino-voice-subtitles.json"
  }`;
  await writeFile(
    path.join(
      outputDir,
      trackKey === "narration" ? "subtitles.json" : "dino-voice-subtitles.json",
    ),
    JSON.stringify(subtitles, null, 2),
    "utf8",
  );

  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId =
    (trackKey === "dinoVoice"
      ? process.env.ELEVENLABS_DINO_VOICE_ID?.trim()
      : process.env.ELEVENLABS_NARRATION_VOICE_ID?.trim()) ||
    process.env.ELEVENLABS_VOICE_ID?.trim() ||
    "21m00Tcm4TlvDq8ikWAM";
  const audioPath = path.join(outputDir, outputFileName);

  try {
    await access(audioPath);
    if (process.env.STATIC_MEDIA_REFRESH_AUDIO !== "true") {
      return {
        status: "success",
        provider: "elevenlabs",
        audioUrl: `${publicBase}/${outputFileName}`,
        transcript: script,
        subtitlesUrl,
        subtitles,
        durationMs: subtitles.at(-1)?.endMs,
      };
    }
  } catch {
    // No existing audio to reuse.
  }

  if (!key || dryRun) {
    await writeDemoMp3(audioPath, dino, trackKey === "narration" ? 1 : 2);
    return {
      status: "demo",
      provider: "demo",
      audioUrl: `${publicBase}/${outputFileName}`,
      transcript: script,
      subtitlesUrl,
      subtitles,
      durationMs: subtitles.at(-1)?.endMs ?? 8000,
      error: key ? undefined : "ELEVENLABS_API_KEY is not set; demo MP3 generated locally.",
    };
  }

  try {
    const base = process.env.ELEVENLABS_API_BASE || "https://api.elevenlabs.io/v1";
    const response = await fetch(
      `${base}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script,
          model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
          voice_settings: speechParams(trackKey),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(audioPath, buffer);
    return {
      status: "success",
      provider: "elevenlabs",
      audioUrl: `${publicBase}/${outputFileName}`,
      transcript: script,
      subtitlesUrl,
      subtitles,
      durationMs: subtitles.at(-1)?.endMs,
    };
  } catch (error) {
    await writeDemoMp3(audioPath, dino, trackKey === "narration" ? 1 : 2);
    return {
      status: "failed",
      provider: "elevenlabs",
      audioUrl: `${publicBase}/${outputFileName}`,
      transcript: script,
      subtitlesUrl,
      subtitles,
      durationMs: subtitles.at(-1)?.endMs ?? 8000,
      error: error instanceof Error ? error.message : "ElevenLabs failed",
    };
  }
}

export const generateNarration = (params: {
  dino: DinoInput;
  script: string;
  outputDir: string;
  publicBase: string;
  dryRun: boolean;
}) =>
  generateSpeechTrack({
    ...params,
    trackKey: "narration",
    maxSubtitleChars: 36,
  });

export const generateDinoVoice = (params: {
  dino: DinoInput;
  script: string;
  outputDir: string;
  publicBase: string;
  dryRun: boolean;
}) =>
  generateSpeechTrack({
    ...params,
    trackKey: "dinoVoice",
    outputFileName: "dino-voice.mp3",
    maxSubtitleChars: 18,
  });
