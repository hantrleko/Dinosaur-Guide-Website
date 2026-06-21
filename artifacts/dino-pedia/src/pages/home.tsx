import { useState, useMemo } from "react";
import { dinosaurs, Era, Diet } from "@/data/dinosaurs";
import { DinoCard } from "@/components/dino-card";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState<Era | "全部">("全部");
  const [selectedDiet, setSelectedDiet] = useState<Diet | "全部">("全部");

  const filteredDinos = useMemo(() => {
    return dinosaurs.filter((dino) => {
      const matchesSearch = 
        dino.nameCn.includes(search) || 
        dino.nameLatin.toLowerCase().includes(search.toLowerCase());
      const matchesEra = selectedEra === "全部" || dino.era === selectedEra;
      const matchesDiet = selectedDiet === "全部" || dino.diet === selectedDiet;
      
      return matchesSearch && matchesEra && matchesDiet;
    });
  }, [search, selectedEra, selectedDiet]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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

      {/* Filters and Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border overflow-x-auto w-full md:w-auto">
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
          
          <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border overflow-x-auto w-full md:w-auto">
            {(["全部", "肉食", "草食", "杂食"] as const).map((diet) => (
              <button
                key={diet}
                onClick={() => setSelectedDiet(diet)}
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
        </div>

        {filteredDinos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDinos.map((dino, index) => (
              <DinoCard key={dino.id} dino={dino} index={index} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border rounded-xl">
            <p className="text-xl text-muted-foreground font-serif">未找到匹配的恐龙记录</p>
            <button 
              onClick={() => { setSearch(""); setSelectedEra("全部"); setSelectedDiet("全部"); }}
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
