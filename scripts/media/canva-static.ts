import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { DinoInput, StaticBehaviorClip, StaticMediaManifest, StaticBehaviorFrame } from "./types.ts";

interface ActionTemplate {
  action: StaticBehaviorClip["action"];
  labelZh: string;
  filter: string;
}

const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    action: "feeding",
    labelZh: "进食",
    filter:
      "zoompan=z='1+0.0009*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=960x540,format=yuv420p",
  },
  {
    action: "running",
    labelZh: "奔跑",
    filter:
      "zoompan=z='1.08-0.04*sin(on/8)':x='(iw/2-(iw/zoom/2))+sin(on/5)*14':y='(ih/2-(ih/zoom/2))+cos(on/7)*10':d=1:s=960x540,format=yuv420p",
  },
  {
    action: "resting",
    labelZh: "休息",
    filter:
      "zoompan=z='1+0.015*cos(on/20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+sin(on/18)*6':d=1:s=960x540,format=yuv420p",
  },
];

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

function canvaImportText(dino: DinoInput) {
  return [
    `${dino.nameCn} / ${dino.nameLatin}`,
    `时代：${dino.era}`,
    `食性：${dino.diet}`,
    `体长：${dino.lengthM}米`,
    `体重：${dino.weightTons}吨`,
    `分布：${dino.region}`,
    `简介：${dino.description}`,
    `趣味知识：${dino.funFact}`,
  ].join("\n");
}

function buildFrames(prefix: string): StaticBehaviorFrame[] {
  return [1, 2, 3, 4, 5, 6].map((index) => ({
    index,
    url: `${prefix}/frame-${String(index).padStart(2, "0")}.png`,
  }));
}

async function buildFramesFallback(
  sourceImage: string,
  frameDir: string,
  prefix: string,
) {
  await run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    sourceImage,
    "-t",
    "6",
    "-vf",
    "fps=1,scale=960x540",
    path.join(frameDir, "frame-%02d.png"),
  ]);
  await ensureFrameCount(frameDir);
  return buildFrames(prefix);
}

async function generateActionClip(params: {
  dino: DinoInput;
  sourceImage: string;
  outputDir: string;
  publicBase: string;
  template: ActionTemplate;
}): Promise<StaticBehaviorClip> {
  const { dino, sourceImage, outputDir, publicBase, template } = params;
  const actionDir = path.join(outputDir, "actions", template.action);
  const frameDir = path.join(actionDir, "frames");
  await mkdir(actionDir, { recursive: true });
  await mkdir(frameDir, { recursive: true });

  const posterPath = path.join(actionDir, "poster.webp");
  const clipPath = path.join(actionDir, "clip.mp4");
  const framePrefix = `${publicBase}/actions/${template.action}/frames`;

  const title = `${dino.nameCn} ${template.labelZh}`;
  const common: Omit<StaticBehaviorClip, "status"> = {
    action: template.action,
    title,
    source: "canva",
    posterUrl: `${publicBase}/actions/${template.action}/poster.webp`,
    frames: buildFrames(framePrefix),
    canvaEditableUrl: process.env.CANVA_EDITABLE_URL,
    prompt: canvaImportText(dino),
  };

  try {
    await run("ffmpeg", [
      "-y",
      "-loop",
      "1",
      "-i",
      sourceImage,
      "-t",
      "6",
      "-vf",
      `${template.filter},fps=24`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      clipPath,
    ]);

    await run("ffmpeg", [
      "-y",
      "-i",
      clipPath,
      "-vf",
      "fps=1",
      "-frames:v",
      "6",
      path.join(frameDir, "frame-%02d.png"),
    ]);
    await ensureFrameCount(frameDir);

    await run("ffmpeg", [
      "-y",
      "-i",
      clipPath,
      "-frames:v",
      "1",
      posterPath,
    ]);

    await writeFile(
      path.join(actionDir, "manifest-action.json"),
      JSON.stringify({ ...common, status: "success" }, null, 2),
      "utf8",
    );

    return {
      ...common,
      status: "success",
      animationUrl: `${publicBase}/actions/${template.action}/clip.mp4`,
      frames: buildFrames(framePrefix),
    };
  } catch (error) {
    await buildFramesFallback(sourceImage, frameDir, framePrefix).catch(() => undefined);
    await run("ffmpeg", [
      "-y",
      "-i",
      sourceImage,
      "-vf",
      "scale=960:-2",
      posterPath,
    ]).catch(() => undefined);

  const fallback: StaticBehaviorClip = {
      ...common,
      status: "failed",
      source: "demo",
      frames: buildFrames(framePrefix),
      error: error instanceof Error ? error.message : "Action clip generation failed",
    };

    await writeFile(
      path.join(actionDir, "manifest-action.json"),
      JSON.stringify({ ...fallback, status: "failed", source: "demo" }, null, 2),
      "utf8",
    );

    return fallback;
  }
}

export async function generateCanvaAsset(params: {
  dino: DinoInput;
  outputDir: string;
  publicBase: string;
  publicDir: string;
}): Promise<StaticMediaManifest["canva"] & { behaviorClips: StaticBehaviorClip[] }> {
  const { dino, outputDir, publicBase, publicDir } = params;
  await mkdir(outputDir, { recursive: true });

  const sourceImage = path.join(publicDir, dino.imageUrl.replace(/^\//, ""));
  const posterPath = path.join(outputDir, "poster.png");
  await copyFile(sourceImage, posterPath);

  const prompt = [
    "Canva connector prompt:",
    `Create an editable museum-style dinosaur poster for ${dino.nameCn} (${dino.nameLatin}).`,
    "Use bold Chinese title typography, fossil texture, timeline markers, and clear stat chips.",
    canvaImportText(dino),
  ].join("\n");

  const behaviorClips = await Promise.all(
    ACTION_TEMPLATES.map((template) =>
      generateActionClip({
        dino,
        sourceImage,
        outputDir,
        publicBase,
        template,
      }),
    ),
  );

  const payload = {
    status: "demo",
    mode: process.env.CANVA_STATIC_MODE || "plugin",
    generatedVia:
      "Canva plugin flow prepared in Codex; local behavior clips are generated as dynamic stand-ins.",
    prompt,
    behaviorClips,
  };
  await writeFile(path.join(outputDir, "canva.json"), JSON.stringify(payload, null, 2), "utf8");

  return {
    status: "demo",
    provider: "canva",
    title: `${dino.nameCn} Canva 视觉卡片`,
    posterUrl: `${publicBase}/poster.png`,
    editableUrl: process.env.CANVA_EDITABLE_URL || undefined,
    promptUrl: `${publicBase}/canva.json`,
    importText: canvaImportText(dino),
    behaviorClips,
    error: process.env.CANVA_EDITABLE_URL
      ? undefined
      : "Canva plugin flow prepared; attach exported editable URL when available.",
  };
}

async function ensureFrameCount(frameDir: string) {
  const files = await readdir(frameDir);
  const existing = files
    .filter((name) => name.startsWith("frame-") && name.endsWith(".png"))
    .sort();

  if (existing.length === 0) {
    throw new Error("No behavior frames generated");
  }

  if (existing.length >= 6) {
    return;
  }

  const sample = path.join(frameDir, existing[0]);
  for (let index = existing.length + 1; index <= 6; index += 1) {
    await copyFile(sample, path.join(frameDir, `frame-${String(index).padStart(2, "0")}.png`));
  }
}
