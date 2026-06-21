import { useParams, Link } from "wouter";
import { dinosaurs } from "@/data/dinosaurs";
import { ArrowLeft, Clock, MapPin, Scale, Ruler, Utensils, Leaf, Drumstick, Sparkles } from "lucide-react";
import NotFound from "./not-found";
import { motion } from "framer-motion";

export default function Detail() {
  const { id } = useParams();
  const dino = dinosaurs.find(d => d.id === id);

  if (!dino) return <NotFound />;

  const DietIcon = dino.diet === "肉食" ? Drumstick : dino.diet === "草食" ? Leaf : Utensils;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Link href="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/80 text-foreground rounded-full border border-border backdrop-blur-md transition-all group" data-testid="link-back">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium text-sm">返回名录</span>
      </Link>

      {/* Hero Image */}
      <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden bg-black">
        <img 
          src={dino.imageUrl} 
          alt={dino.nameCn} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium backdrop-blur-sm">
                {dino.era}
              </span>
              <span className="px-3 py-1 bg-accent/20 text-accent-foreground border border-accent/30 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-1.5">
                <DietIcon size={14} />
                {dino.diet}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-2 drop-shadow-md">
              {dino.nameCn}
            </h1>
            <p className="text-xl md:text-3xl font-sans font-light text-muted-foreground italic">
              {dino.nameLatin}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <motion.div 
          className="lg:col-span-2 space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <section>
            <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-3">
              物种描述
              <div className="h-px flex-1 bg-border/50"></div>
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-muted-foreground font-serif">
                {dino.description}
              </p>
            </div>
          </section>

          <section>
            <div className="relative p-8 rounded-2xl bg-secondary border border-border overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles size={120} />
              </div>
              <h3 className="text-xl font-serif font-bold text-accent mb-4 flex items-center gap-2 relative z-10">
                <Sparkles size={20} />
                趣味知识
              </h3>
              <p className="text-foreground text-lg relative z-10 font-serif">
                {dino.funFact}
              </p>
            </div>
          </section>
        </motion.div>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-serif font-bold text-foreground mb-6">核心数据</h3>
            <ul className="space-y-5">
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">时代</p>
                  <p className="text-foreground font-medium">{dino.era}</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-accent">
                  <DietIcon size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">食性</p>
                  <p className="text-foreground font-medium">{dino.diet}</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <Ruler size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">体长</p>
                  <p className="text-foreground font-medium">{dino.lengthM} 米</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-accent">
                  <Scale size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">体重</p>
                  <p className="text-foreground font-medium">{dino.weightTons} 吨</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">产地</p>
                  <p className="text-foreground font-medium">{dino.region}</p>
                </div>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
