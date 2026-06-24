import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DinoInput, StaticMediaManifest } from "./types.ts";

export async function generateDescriptProject(params: {
  dino: DinoInput;
  outputDir: string;
  publicBase: string;
  dryRun: boolean;
}): Promise<StaticMediaManifest["descript"]> {
  const { dino, outputDir, publicBase, dryRun } = params;
  await mkdir(outputDir, { recursive: true });
  const token = process.env.DESCRIPT_API_KEY;
  const sourceBaseUrl = process.env.DESCRIPT_SOURCE_BASE_URL;

  if (!token || !sourceBaseUrl || dryRun) {
    const payload = {
      status: token && sourceBaseUrl ? "demo" : "skipped",
      provider: "descript",
      reason: !token
        ? "DESCRIPT_API_KEY is not set"
        : !sourceBaseUrl
          ? "DESCRIPT_SOURCE_BASE_URL is not set; Descript imports require a public media URL"
          : "Dry run enabled",
      intendedAudioUrl: `${sourceBaseUrl ?? ""}${publicBase}/narration.mp3`,
    };
    await writeFile(path.join(outputDir, "descript.json"), JSON.stringify(payload, null, 2), "utf8");
    return {
      status: token && sourceBaseUrl ? "demo" : "skipped",
      provider: "descript",
      transcriptUrl: `${publicBase}/subtitles.json`,
      error: payload.reason,
    };
  }

  try {
    const response = await fetch("https://descriptapi.com/v1/jobs/import/project_media", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        project_name: `Dinosaur Guide - ${dino.nameCn}`,
        add_media: {
          "narration.mp3": {
            url: `${sourceBaseUrl}${publicBase}/narration.mp3`,
          },
        },
        add_compositions: [
          {
            name: `${dino.nameCn} 讲解`,
            clips: [{ media: "narration.mp3" }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Descript HTTP ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    await writeFile(path.join(outputDir, "descript.json"), JSON.stringify(payload, null, 2), "utf8");

    return {
      status: "success",
      provider: "descript",
      projectUrl: typeof payload.project_url === "string" ? payload.project_url : undefined,
      transcriptUrl: `${publicBase}/subtitles.json`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Descript failed";
    await writeFile(
      path.join(outputDir, "descript.json"),
      JSON.stringify({ status: "failed", error: message }, null, 2),
      "utf8",
    );
    return {
      status: "failed",
      provider: "descript",
      transcriptUrl: `${publicBase}/subtitles.json`,
      error: message,
    };
  }
}
