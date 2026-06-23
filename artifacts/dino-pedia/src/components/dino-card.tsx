import { Link } from "wouter";
import { motion } from "framer-motion";
import { Drumstick, FileAudio, LayoutTemplate, Star, Utensils, Leaf } from "lucide-react";
import type { MouseEvent } from "react";
import type { Dinosaur } from "@/data/dinosaurs";

interface DinoCardProps {
  dino: Dinosaur;
  index: number;
  isFavorited?: boolean;
  onGenerateVoice?: (dino: Dinosaur) => void;
  onGenerateDeck?: (dino: Dinosaur) => void;
  onToggleFavorite?: (dinoId: string) => void;
}

export function DinoCard({
  dino,
  index,
  isFavorited,
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
    >
      <Link href={`/dino/${dino.id}`} className="block group h-full">
        <div
          className="relative h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_10px_30px_-10px_rgba(255,166,0,0.2)] group-hover:border-primary/50"
          data-testid={`card-dino-${dino.id}`}
        >
          <div className="aspect-[4/3] w-full overflow-hidden relative bg-black">
            <img
              src={dino.imageUrl}
              alt={dino.nameCn}
              className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

            <div className="absolute top-3 right-3 flex gap-2">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-black/60 text-primary border border-primary/20 backdrop-blur-md">
                {dino.era}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4 relative">
            <div className="absolute top-0 right-5 -translate-y-1/2 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
              <DietIcon size={18} />
            </div>

            <h3 className="text-2xl font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {dino.nameCn}
            </h3>
            <p className="text-sm font-sans text-muted-foreground italic">
              {dino.nameLatin}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground border-b border-border pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                长 {dino.lengthM}m
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                重 {dino.weightTons}t
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                data-testid={`card-action-voice-${dino.id}`}
                type="button"
                onClick={(event) =>
                  handleAction(event, () => onGenerateVoice?.(dino))
                }
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 text-xs font-medium transition-colors"
              >
                <FileAudio size={14} />
                讲解音频
              </button>
              <button
                data-testid={`card-action-deck-${dino.id}`}
                type="button"
                onClick={(event) =>
                  handleAction(event, () => onGenerateDeck?.(dino))
                }
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 text-xs font-medium transition-colors"
              >
                <LayoutTemplate size={14} />
                生成展示页
              </button>
              <button
                data-testid={`card-action-fav-${dino.id}`}
                type="button"
                onClick={(event) =>
                  handleAction(event, () => onToggleFavorite?.(dino.id))
                }
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
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
