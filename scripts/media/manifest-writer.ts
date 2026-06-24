import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDeckContent,
  buildDinoVoiceScript,
  buildNarrationScript,
  defaultDinoIds,
  loadDinosaurs,
  pickDinosaurs,
} from "./dinosaur-source.ts";
import { generateCanvaAsset } from "./canva-static.ts";
import { generateDescriptProject } from "./descript-static.ts";
import { generateDinoVoice, generateNarration } from "./elevenlabs-static.ts";
import { generateGammaDeck } from "./gamma-static.ts";
import type { StaticMediaIndex, StaticMediaManifest } from "./types.ts";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const publicDir = path.join(repoRoot, "artifacts", "dino-pedia", "public");
const staticRoot = path.join(publicDir, "static-media");

function hasFlag(args: string[], flag: string) {
  return args.includes(flag);
}

async function writeManifest(manifest: StaticMediaManifest, outputDir: string) {
  await writeFile(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );
}

export async function generateStaticMedia(args: string[]) {
  const dryRun = hasFlag(args, "--dry-run");
  const dinosaurs = pickDinosaurs(await loadDinosaurs(), args);
  const generatedAt = new Date().toISOString();
  await mkdir(staticRoot, { recursive: true });

  const manifests: StaticMediaManifest[] = [];
  for (const dino of dinosaurs) {
    const outputDir = path.join(staticRoot, dino.id);
    const publicBase = `/static-media/${dino.id}`;
    await mkdir(outputDir, { recursive: true });

    const script = buildNarrationScript(dino);
    const deckContent = buildDeckContent(dino);
    const dinoVoiceScript = buildDinoVoiceScript(dino);
    const narration = await generateNarration({
      dino,
      script,
      outputDir,
      publicBase,
      dryRun,
    });
    const dinoVoice = await generateDinoVoice({
      dino,
      script: dinoVoiceScript,
      outputDir,
      publicBase,
      dryRun,
    });
    const gamma = await generateGammaDeck({
      dino,
      content: deckContent,
      outputDir,
      publicBase,
      dryRun,
    });
    const canva = await generateCanvaAsset({
      dino,
      outputDir,
      publicBase,
      publicDir,
    });
    const descript = await generateDescriptProject({
      dino,
      outputDir,
      publicBase,
      dryRun,
      dinoVoiceAudioFile: dinoVoice.audioUrl ? dinoVoice.audioUrl.replace(`${publicBase}/`, "") : "dino-voice.mp3",
    });

    const manifest: StaticMediaManifest = {
      dinoId: dino.id,
      nameCn: dino.nameCn,
      nameLatin: dino.nameLatin,
      generatedAt,
      source: "static-media-v2",
      narration,
      dinoVoice,
      gamma,
      canva,
      descript,
      visual: {
        behaviorClips: canva?.behaviorClips,
      },
    };
    await writeManifest(manifest, outputDir);
    manifests.push(manifest);
  }

  const index: StaticMediaIndex = {
    generatedAt,
    source: "static-media-v2",
    defaultDinoIds,
    items: Object.fromEntries(
      manifests.map((manifest) => [
        manifest.dinoId,
        {
          dinoId: manifest.dinoId,
          nameCn: manifest.nameCn,
          manifestUrl: `/static-media/${manifest.dinoId}/manifest.json`,
          hasNarration:
            manifest.narration?.status === "success" ||
            manifest.narration?.status === "demo" ||
            manifest.narration?.status === "failed",
          hasDinoVoice:
            manifest.dinoVoice?.status === "success" ||
            manifest.dinoVoice?.status === "demo" ||
            manifest.dinoVoice?.status === "failed",
          hasDeck:
            manifest.gamma?.status === "success" ||
            manifest.gamma?.status === "demo" ||
            manifest.gamma?.status === "failed" ||
            Boolean(manifest.gamma?.deckUrl),
          hasCanva:
            manifest.canva?.status === "success" ||
            manifest.canva?.status === "demo" ||
            Boolean(manifest.canva?.posterUrl),
          hasBehaviorClips:
            Boolean(manifest.visual?.behaviorClips && manifest.visual.behaviorClips.length > 0),
          hasDescript: manifest.descript?.status === "success",
        },
      ]),
    ),
  };

  await writeFile(path.join(staticRoot, "index.json"), JSON.stringify(index, null, 2), "utf8");
  console.log(`Generated static media manifests for ${manifests.length} dinosaurs.`);
}
