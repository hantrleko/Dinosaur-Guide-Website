import type { DinoInput } from "./types.ts";

export const defaultDinoIds = [
  "tyrannosaurus-rex",
  "velociraptor",
  "triceratops",
  "brachiosaurus",
  "stegosaurus",
  "spinosaurus",
];

export async function loadDinosaurs(): Promise<DinoInput[]> {
  const moduleUrl = new URL(
    "../../artifacts/api-server/src/data/dinosaurs.ts",
    import.meta.url,
  );
  const mod = (await import(moduleUrl.href)) as { dinosaurs?: DinoInput[] };
  if (!Array.isArray(mod.dinosaurs)) {
    throw new Error("Unable to load dinosaur seed data");
  }
  return mod.dinosaurs;
}

export function pickDinosaurs(dinosaurs: DinoInput[], args: string[]) {
  if (args.includes("--all")) {
    return dinosaurs;
  }

  const idsArg = args.find((arg) => arg.startsWith("--ids="));
  if (idsArg) {
    const selected = new Set(
      idsArg
        .replace("--ids=", "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    );
    return dinosaurs.filter((dino) => selected.has(dino.id));
  }

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg
    ? Number(limitArg.replace("--limit=", ""))
    : Number(process.env.STATIC_MEDIA_DINO_LIMIT ?? defaultDinoIds.length);

  const defaultSet = new Set(defaultDinoIds);
  const defaultDinos = dinosaurs.filter((dino) => defaultSet.has(dino.id));

  return Number.isFinite(limit) && limit > 0
    ? defaultDinos.slice(0, limit)
    : defaultDinos;
}

export function buildNarrationScript(dino: DinoInput) {
  return [
    `${dino.nameCn}（${dino.nameLatin}）是${dino.era}的代表性古生物。`,
    `它属于${dino.diet}类型，体长约${dino.lengthM}米，体重约${dino.weightTons}吨，主要分布在${dino.region}。`,
    dino.description,
    `趣味知识：${dino.funFact}`,
  ].join(" ");
}

export function buildDinoVoiceScript(dino: DinoInput) {
  return [
    `注意：我是一只${dino.nameCn}， ${dino.nameLatin}。`,
    `我栖息于${dino.era}，来自${dino.region}，属于${dino.diet}类型。`,
    `体长${dino.lengthM}米，体重${dino.weightTons}吨。`,
    "咆哮吧！",
  ].join(" ");
}

export function buildDeckContent(dino: DinoInput) {
  return [
    `${dino.nameCn}（${dino.nameLatin}）`,
    `时代：${dino.era}`,
    `食性：${dino.diet}`,
    `体长：${dino.lengthM}米`,
    `体重：${dino.weightTons}吨`,
    `分布：${dino.region}`,
    `简介：${dino.description}`,
    `趣味：${dino.funFact}`,
  ].join("\n");
}
