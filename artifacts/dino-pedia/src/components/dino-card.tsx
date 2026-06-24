import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bone,
  Drumstick,
  FileAudio,
  LayoutTemplate,
  Leaf,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import type { MouseEvent } from "react";
import type { Dinosaur } from "@/data/dinosaurs";

interface DinoCardProps {
  dino: Dinosaur;
  index: number;
  isFavorited?: boolean;
  hasStaticMedia?: boolean;
  hasBehaviorMedia?: boolean;
  hasDinoVoice?: boolean;
  onGenerateVoice?: (dino: Dinosaur) => void;
  onGenerateDeck?: (dino: Dinosaur) => void;
  onToggleFavorite?: (dinoId: string) => void;
}

export function DinoCard({
  dino,
  index,
  isFavorited,
  hasStaticMedia,
  hasBehaviorMedia,
  hasDinoVoice,
  onGenerateVoice,
  onGenerateDeck,
  onToggleFavorite,
}: DinoCardProps) {
  const DietIcon = dino.diet === "肉食" ? Drumstick : dino.diet === "草食" ? Leaf : Utensils;

  function handleAction(e: MouseEvent, action: () => void) {
    e.preventDefault();
    e.stopPropagation();
    action();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/dino/${dino.id}`} className="block group h-full">
        <div
          className="relative h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_18px_50px_-28px_rgba(255,166,0,0.5)] group-hover:border-primary/60"
          data-testid={`card-dino-${dino.id}`}
        >
          <div className="aspect-[4/3] w-full overflow-hidden relative bg-black">
            <img
              src={dino.imageUrl}
              alt={dino.nameCn}
              className="w-full h-full object-cover opacity-85 transition-transform duration-900 group-hover:scale-110 group-hover:opacity-100"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,172,64,0.28),transparent_45%),radial-gradient(circle_at_20%_75%,rgba(120,70,0,0.38),transparent_38%)]" />

            <div className="absolute top-3 right-3 flex gap-2">
              {hasStaticMedia ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/22 text-emerald-100 border border-emerald-400/35 backdrop-blur-md">
                  <BadgeCheck size={12} />
                  静态资源
                </span>
              ) : null}
              {hasBehaviorMedia ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/22 text-cyan-100 border border-cyan-400/35 backdrop-blur-md">
                  <Sparkles size={12} />
                  动态行为
                </span>
              ) : null}
              {hasDinoVoice ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-rose-500/22 text-rose-100 border border-rose-400/35 backdrop-blur-md">
                  <Bone size={12} />
                  恐龙语音
                </span>
              ) : null}
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-black/60 text-primary border border-primary/20 backdrop-blur-md">
                {dino.era}
              </span>
            </div>

            {hasStaticMedia ? (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-black/60 text-amber-200 border border-amber-200/40">
                <Sparkles size={12} />
                打开即可播放
              </span>
            ) : null}
          </div>

          <div className="p-5 space-y-4 relative">
            <div className="absolute top-0 right-5 -translate-y-1/2 w-11 h-11 rounded-full bg-gradient-to-br from-amber-500/80 to-amber-700/70 border border-amber-200/35 flex items-center justify-center text-foreground shadow-lg shadow-amber-900/40 transition-colors group-hover:border-amber-300/60">
              <DietIcon size={18} />
            </div>

            <h3 className="text-2xl font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {dino.nameCn}
            </h3>
            <p className="text-sm font-sans text-muted-foreground italic">{dino.nameLatin}</p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground border-b border-border pb-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                长 {dino.lengthM}m
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                重 {dino.weightTons}t
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                <p className="text-[11px] text-muted-foreground">内容</p>
                <p className="text-sm font-semibold text-emerald-200">
                  {hasStaticMedia ? "就绪" : "未就绪"}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                <p className="text-[11px] text-muted-foreground">行为</p>
                <p className="text-sm font-semibold text-cyan-200">{hasBehaviorMedia ? "3类" : "待补"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                <p className="text-[11px] text-muted-foreground">语音</p>
                <p className="text-sm font-semibold text-rose-200">{hasDinoVoice ? "双轨" : "待补"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                data-testid={`card-action-voice-${dino.id}`}
                type="button"
                onClick={(event) => handleAction(event, () => onGenerateVoice?.(dino))}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/35 hover:bg-primary/30 text-xs font-medium transition-colors"
              >
                <FileAudio size={14} />
                {hasStaticMedia ? "已有讲解" : "生成讲解"}
              </button>
              <button
                data-testid={`card-action-deck-${dino.id}`}
                type="button"
                onClick={(event) => handleAction(event, () => onGenerateDeck?.(dino))}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent border border-accent/35 hover:bg-accent/30 text-xs font-medium transition-colors"
              >
                <LayoutTemplate size={14} />
                {hasStaticMedia ? "已有展示" : "生成展示页"}
              </button>
              <button
                data-testid={`card-action-fav-${dino.id}`}
                type="button"
                onClick={(event) => handleAction(event, () => onToggleFavorite?.(dino.id))}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  isFavorited
                    ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                    : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                <Star size={14} />
                {isFavorited ? "已收藏" : "收藏"}
              </button>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/35 text-primary text-xs font-semibold bg-primary/10">
                进入详情页体验行为与双语音轨
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
