import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DinoInput, StaticMediaManifest } from "./types.ts";
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

async function writeDemoMp3(filePath: string, dino: DinoInput) {
  const frequency = 260 + (dino.nameLatin.length % 10) * 28;
  await run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=${frequency}:duration=5`,
    "-filter:a",
    "volume=0.08",
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "6",
    filePath,
  ]);
}

export async function generateNarration(params: {
  dino: DinoInput;
  script: string;
  outputDir: string;
  publicBase: string;
  dryRun: boolean;
}): Promise<StaticMediaManifest["narration"]> {
  const { dino, script, outputDir, publicBase, dryRun } = params;
  const subtitles = splitSubtitles(script);
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "subtitles.json"),
    JSON.stringify(subtitles, null, 2),
    "utf8",
  );

  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId =
    process.env.ELEVENLABS_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM";
  const audioPath = path.join(outputDir, "narration.mp3");

  try {
    await access(audioPath);
    if (process.env.STATIC_MEDIA_REFRESH_AUDIO !== "true") {
      return {
        status: "success",
        provider: "elevenlabs",
        audioUrl: `${publicBase}/narration.mp3`,
        transcript: script,
        subtitlesUrl: `${publicBase}/subtitles.json`,
        subtitles,
        durationMs: subtitles.at(-1)?.endMs,
      };
    }
  } catch {
    // No existing audio to reuse.
  }

  if (!key || dryRun) {
    await writeDemoMp3(audioPath, dino);
    return {
      status: "demo",
      provider: "demo",
      audioUrl: `${publicBase}/narration.mp3`,
      transcript: script,
      subtitlesUrl: `${publicBase}/subtitles.json`,
      subtitles,
      durationMs: subtitles.at(-1)?.endMs ?? 5000,
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
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
          },
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
      audioUrl: `${publicBase}/narration.mp3`,
      transcript: script,
      subtitlesUrl: `${publicBase}/subtitles.json`,
      subtitles,
      durationMs: subtitles.at(-1)?.endMs,
    };
  } catch (error) {
    await writeDemoMp3(audioPath, dino);
    return {
      status: "failed",
      provider: "elevenlabs",
      audioUrl: `${publicBase}/narration.mp3`,
      transcript: script,
      subtitlesUrl: `${publicBase}/subtitles.json`,
      subtitles,
      durationMs: subtitles.at(-1)?.endMs ?? 5000,
      error: error instanceof Error ? error.message : "ElevenLabs failed",
    };
  }
}
