"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  User,
  Palette,
  Zap,
  Trophy,
  Star,
  Gem,
  Crown,
  Shield,
  Sparkles,
  TrendingUp,
  Target,
  Flame,
  CheckSquare,
  Clock,
  Calendar,
  Gift,
  Rocket
} from "lucide-react";
import useSWR from "swr";
import { PlayerStats } from "@/types";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "avatars" | "frames" | "themes" | "boosters" | "difficulties" | "achievements";
  icon: any;
  rarity: "common" | "rare" | "epic" | "legendary";
  owned?: boolean;
  preview?: string;
}

const shopItems: ShopItem[] = [
  // Avatars
  {
    id: "avatar_crown",
    name: "Königlicher Avatar",
    description: "Zeige deinen königlichen Status mit dieser exklusiven Krone",
    price: 500,
    category: "avatars",
    icon: Crown,
    rarity: "legendary"
  },
  {
    id: "avatar_shield",
    name: "Ritter Schild",
    description: "Beschütze dich mit diesem mächtigen Schild-Avatar",
    price: 250,
    category: "avatars",
    icon: Shield,
    rarity: "epic"
  },
  {
    id: "avatar_star",
    name: "Stern Avatar",
    description: "Leuchte wie ein Stern mit diesem strahlenden Avatar",
    price: 150,
    category: "avatars",
    icon: Star,
    rarity: "rare"
  },

  // Frames
  {
    id: "frame_gold",
    name: "Goldener Rahmen",
    description: "Luxuriöser goldener Rahmen für dein Profilbild",
    price: 300,
    category: "frames",
    icon: Sparkles,
    rarity: "epic"
  },
  {
    id: "frame_fire",
    name: "Flammen Rahmen",
    description: "Brennender Rahmen für heiße Streaks",
    price: 200,
    category: "frames",
    icon: Flame,
    rarity: "rare"
  },

  // Themes
  {
    id: "theme_dark",
    name: "Midnight Theme",
    description: "Elegantes dunkles Theme für nächtliche Produktivität",
    price: 400,
    category: "themes",
    icon: Palette,
    rarity: "epic"
  },
  {
    id: "theme_neon",
    name: "Neon Glow Theme",
    description: "Futuristisches Neon-Theme mit leuchtenden Akzenten",
    price: 600,
    category: "themes",
    icon: Zap,
    rarity: "legendary"
  },

  // Boosters
  {
    id: "booster_xp_2x",
    name: "2x XP Booster",
    description: "Verdopple deine XP für 24 Stunden",
    price: 100,
    category: "boosters",
    icon: TrendingUp,
    rarity: "common"
  },
  {
    id: "booster_gems_2x",
    name: "2x Gem Booster",
    description: "Verdopple deine Gem-Belohnungen für 24 Stunden",
    price: 150,
    category: "boosters",
    icon: Gem,
    rarity: "rare"
  },
  {
    id: "booster_streak_protect",
    name: "Streak Schutz",
    description: "Schütze deine Streak vor dem Verlust für 7 Tage",
    price: 200,
    category: "boosters",
    icon: Shield,
    rarity: "epic"
  },

  // Difficulties
  {
    id: "difficulty_extreme",
    name: "Extreme Schwierigkeit",
    description: "Schalte die Extreme Schwierigkeit frei (50 XP pro Todo)",
    price: 800,
    category: "difficulties",
    icon: Flame,
    rarity: "legendary"
  },
  {
    id: "difficulty_nightmare",
    name: "Nightmare Modus",
    description: "Der ultimative Nightmare Modus (100 XP pro Todo)",
    price: 1500,
    category: "difficulties",
    icon: Crown,
    rarity: "legendary"
  },

  // Achievements
  {
    id: "achievement_collector",
    name: "Sammler Erfolg",
    description: "Spezieller Erfolg für Shop-Liebhaber",
    price: 300,
    category: "achievements",
    icon: Trophy,
    rarity: "epic"
  },
  {
    id: "achievement_spender",
    name: "Großzügiger Spender",
    description: "Erfolg für das Ausgeben von 1000+ Gems",
    price: 500,
    category: "achievements",
    icon: Gift,
    rarity: "legendary"
  }
];

const categories = [
  { id: "avatars", name: "Avatare", icon: User, description: "Personalisiere dein Profilbild" },
  { id: "frames", name: "Rahmen", icon: Target, description: "Stilvolle Rahmen für dein Profil" },
  { id: "themes", name: "Themes", icon: Palette, description: "Ändere das Aussehen der App" },
  { id: "boosters", name: "Booster", icon: Rocket, description: "Temporäre Verbesserungen" },
  { id: "difficulties", name: "Schwierigkeiten", icon: Flame, description: "Neue Herausforderungsstufen" },
  { id: "achievements", name: "Erfolge", icon: Trophy, description: "Exklusive Erfolge kaufen" }
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common": return "from-gray-500 to-slate-500";
    case "rare": return "from-blue-500 to-cyan-500";
    case "epic": return "from-purple-500 to-pink-500";
    case "legendary": return "from-yellow-500 to-orange-500";
    default: return "from-gray-500 to-slate-500";
  }
};

const getRarityBorder = (rarity: string) => {
  switch (rarity) {
    case "common": return "border-gray-500/30";
    case "rare": return "border-blue-500/30";
    case "epic": return "border-purple-500/30";
    case "legendary": return "border-yellow-500/30";
    default: return "border-gray-500/30";
  }
};

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("avatars");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  
  const { data: stats } = useSWR<PlayerStats>("/api/player-stats");
  
  const filteredItems = shopItems.filter(item => item.category === selectedCategory);
  
  const handlePurchase = async (item: ShopItem) => {
    if (!stats || stats.gems < item.price) return;
    
    setPurchasingId(item.id);
    
    try {
      // TODO: Implement purchase API
      console.log(`Purchasing ${item.name} for ${item.price} gems`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setPurchasingId(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingBag className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Gem Shop</h1>
          </div>
          <p className="text-slate-300 text-lg">
            Verwende deine hart verdienten Edelsteine für exklusive Upgrades und Anpassungen!
          </p>
          
          {/* Gem Balance */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30"
          >
            <Gem className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold text-white">
              {stats?.gems?.toLocaleString() || 0} Edelsteine
            </span>
          </motion.div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-slate-800/50 border border-slate-700/50">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <category.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Category Description */}
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30"
            >
              {(() => {
                const category = categories.find(c => c.id === selectedCategory);
                return (
                  <div className="flex items-center gap-3">
                    {category && <category.icon className="w-5 h-5 text-purple-400" />}
                    <div>
                      <h3 className="font-semibold text-white">{category?.name}</h3>
                      <p className="text-sm text-slate-400">{category?.description}</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            {/* Items Grid */}
            <TabsContent value={selectedCategory} className="mt-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <Card className={`h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 ${getRarityBorder(item.rarity)} backdrop-blur-sm overflow-hidden`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${getRarityColor(item.rarity)} shadow-lg`}>
                            <item.icon className="w-6 h-6 text-white" />
                          </div>
                          <Badge
                            variant="outline"
                            className={`bg-gradient-to-r ${getRarityColor(item.rarity)} border-none text-white text-xs font-bold`}
                          >
                            {item.rarity.toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-white mt-3">
                          {item.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gem className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white">
                              {item.price.toLocaleString()}
                            </span>
                          </div>
                          
                          {item.owned ? (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              Besessen
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => handlePurchase(item)}
                              disabled={!stats || stats.gems < item.price || purchasingId === item.id}
                              className={`bg-gradient-to-r ${getRarityColor(item.rarity)} hover:scale-105 transition-all duration-200 text-white font-semibold`}
                              size="sm"
                            >
                              {purchasingId === item.id ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <Sparkles className="w-4 h-4" />
                                </motion.div>
                              ) : (
                                "Kaufen"
                              )}
                            </Button>
                          )}
                        </div>
                        
                        {!stats || stats.gems < item.price ? (
                          <p className="text-xs text-red-400">
                            Nicht genügend Edelsteine
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
              
              {filteredItems.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">
                    Keine Items in dieser Kategorie verfügbar
                  </p>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
        
        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
        >
          <div className="text-center space-y-3">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Mehr kommt bald!</h3>
            <p className="text-slate-300">
              Wir arbeiten an noch mehr aufregenden Items und Features für den Shop.
              Bleib dran für Updates!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
