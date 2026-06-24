import { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGetDinos, useCreateDeckJob, useCreateVoiceJob } from "@workspace/api-client-react";
import { Search, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { dinosaurs, Era, type Dinosaur } from "@/data/dinosaurs";
import { DinoCard } from "@/components/dino-card";
import { useStaticMediaIndex } from "@/lib/static-media";

const FAVORITE_STORAGE_KEY = "dino-pedia-favorites";

function readFavoritesFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeFavoritesToStorage(ids: string[]) {
  try {
    localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState<Era | "全部">("全部");
  const [selectedDiet, setSelectedDiet] = useState<"肉食" | "草食" | "杂食" | "全部">("全部");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readFavoritesFromStorage(),
  );

  const dinosQuery = useGetDinos({
    query: {
      staleTime: 30_000,
      retry: 1,
    },
  });
  const staticMediaIndex = useStaticMediaIndex();

  const createVoiceMutation = useCreateVoiceJob({
    mutation: {
      onError: (error) => {
        toast({
          title: "生成语音任务失败",
          description:
            error instanceof Error ? error.message : "网络或服务暂时不可用",
        });
      },
    },
  });

  const createDeckMutation = useCreateDeckJob({
    mutation: {
      onError: (error) => {
        toast({
          title: "生成展示页失败",
          description:
            error instanceof Error ? error.message : "网络或服务暂时不可用",
        });
      },
    },
  });

  const dinosaursSource: Dinosaur[] = useMemo(() => {
    if (dinosQuery.data?.items?.length) {
      return dinosQuery.data.items;
    }

    return dinosaurs;
  }, [dinosQuery.data]);

  const filteredDinos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return dinosaursSource.filter((dino) => {
      const matchesSearch =
        dino.nameCn.includes(search) ||
        dino.nameLatin.toLowerCase().includes(normalizedSearch);
      const matchesEra = selectedEra === "全部" || dino.era === selectedEra;
      const matchesDiet =
        selectedDiet === "全部" || dino.diet === selectedDiet;
      const matchesFavorite = !favoriteOnly || favoriteIds.includes(dino.id);
      return matchesSearch && matchesEra && matchesDiet && matchesFavorite;
    });
  }, [dinosaursSource, search, selectedEra, selectedDiet, favoriteOnly, favoriteIds]);

  const handleToggleFavorite = useCallback((dinoId: string) => {
    setFavoriteIds((previous) => {
      const next = previous.includes(dinoId)
        ? previous.filter((item) => item !== dinoId)
        : [...previous, dinoId];
      writeFavoritesToStorage(next);
      return next;
    });
  }, []);

  const buildNarrationScript = useCallback((dino: Dinosaur) => {
    return [
      `${dino.nameCn}（${dino.nameLatin}）是${dino.era}的代表性恐龙。`,
      `这只恐龙属于${dino.diet}类别，体长约${dino.lengthM}米，体重约${dino.weightTons}吨，产自${dino.region}。`,
      dino.description,
      `小知识：${dino.funFact}`,
    ].join(" ");
  }, []);

  const buildDeckContent = useCallback((dino: Dinosaur) => {
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
  }, []);

  const handleCreateVoice = useCallback(
    async (dino: Dinosaur) => {
      const payload = {
        dinoId: dino.id,
        script: buildNarrationScript(dino),
      };
      const job = await createVoiceMutation.mutateAsync(payload);
      navigate(`/dino/${dino.id}?voiceJob=${encodeURIComponent(job.id)}`);
    },
    [buildNarrationScript, createVoiceMutation, navigate],
  );

  const handleCreateDeck = useCallback(
    async (dino: Dinosaur) => {
      const payload = {
        dinoId: dino.id,
        content: buildDeckContent(dino),
        style: "museum",
      };
      const job = await createDeckMutation.mutateAsync(payload);
      navigate(`/dino/${dino.id}?deckJob=${encodeURIComponent(job.id)}`);
    },
    [buildDeckContent, createDeckMutation, navigate],
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.png"
            alt="Prehistoric landscape"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-accent mb-6 drop-shadow-lg"
          >
            恐龙大全
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground font-serif max-w-2xl mx-auto"
          >
            探索远古时代的地球霸主，揭开千万年前的生命奥秘。
          </motion.p>

          {dinosQuery.isError && !dinosQuery.data?.items?.length ? (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-destructive/20 border border-destructive/40 text-destructive">
              <span>服务端接口不可用，已切换到本地离线数据</span>
            </div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 max-w-xl mx-auto relative group"
          >
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="输入恐龙中文名或拉丁学名搜索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
              className="w-full h-14 pl-12 pr-4 bg-black/50 border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary backdrop-blur-sm transition-all"
            />
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border overflow-x-auto">
            {(["全部", "三叠纪", "侏罗纪", "白垩纪"] as const).map((era) => (
              <button
                key={era}
                onClick={() => setSelectedEra(era)}
                data-testid={`filter-era-${era}`}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedEra === era
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {era}
              </button>
            ))}
          </div>

          <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border overflow-x-auto">
            {(["全部", "肉食", "草食", "杂食"] as const).map((diet) => (
              <button
                key={diet}
                onClick={() => setSelectedDiet(diet as (typeof selectedDiet))}
                data-testid={`filter-diet-${diet}`}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedDiet === diet
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {diet}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFavoriteOnly((current) => !current)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors flex items-center gap-2 ${
              favoriteOnly
                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star size={14} />
            收藏({favoriteIds.length})
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          数据来源：
          {dinosQuery.isLoading
            ? " 正在连接服务端..."
            : dinosQuery.data?.items?.length
              ? " 后端 /api/dinos"
              : " 本地静态降级"}
          {staticMediaIndex.data
            ? ` · 已预生成 ${Object.keys(staticMediaIndex.data.items).length} 个多媒体资源`
            : ""}
        </p>

        {filteredDinos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDinos.map((dino, index) => (
                <DinoCard
                  key={dino.id}
                  dino={dino}
                  index={index}
                  isFavorited={favoriteIds.includes(dino.id)}
                  hasStaticMedia={Boolean(staticMediaIndex.data?.items?.[dino.id])}
                  hasBehaviorMedia={Boolean(staticMediaIndex.data?.items?.[dino.id]?.hasBehaviorClips)}
                  hasDinoVoice={Boolean(staticMediaIndex.data?.items?.[dino.id]?.hasDinoVoice)}
                  onGenerateDeck={handleCreateDeck}
                  onGenerateVoice={handleCreateVoice}
                  onToggleFavorite={handleToggleFavorite}
                />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border rounded-xl">
            <p className="text-xl text-muted-foreground font-serif">
              未找到匹配的恐龙记录
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedEra("全部");
                setSelectedDiet("全部");
                setFavoriteOnly(false);
              }}
              className="mt-4 text-primary hover:text-primary/80 transition-colors"
            >
              重置过滤条件
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
