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
  Rocket,
} from "lucide-react";
import useSWR from "swr";
import { PlayerStats } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category:
    | "avatars"
    | "frames"
    | "themes"
    | "boosters"
    | "difficulties"
    | "achievements";
  icon: any;
  rarity: "common" | "rare" | "epic" | "legendary";
  owned?: boolean;
  preview?: string;
}

const shopItems: ShopItem[] = [
  // Avatars
  {
    id: "avatar_crown",
    name: "shop.items.royalAvatar",
    description: "shop.items.royalAvatarDesc",
    price: 500,
    category: "avatars",
    icon: Crown,
    rarity: "legendary",
  },
  {
    id: "avatar_shield",
    name: "shop.items.knightShield",
    description: "shop.items.knightShieldDesc",
    price: 250,
    category: "avatars",
    icon: Shield,
    rarity: "epic",
  },
  {
    id: "avatar_star",
    name: "shop.items.starAvatar",
    description: "shop.items.starAvatarDesc",
    price: 150,
    category: "avatars",
    icon: Star,
    rarity: "rare",
  },

  // Frames
  {
    id: "frame_gold",
    name: "shop.items.goldenFrame",
    description: "shop.items.goldenFrameDesc",
    price: 300,
    category: "frames",
    icon: Sparkles,
    rarity: "epic",
  },
  {
    id: "frame_fire",
    name: "shop.items.flameFrame",
    description: "shop.items.flameFrameDesc",
    price: 200,
    category: "frames",
    icon: Flame,
    rarity: "rare",
  },

  // Themes
  {
    id: "theme_dark",
    name: "shop.items.midnightTheme",
    description: "shop.items.midnightThemeDesc",
    price: 400,
    category: "themes",
    icon: Palette,
    rarity: "epic",
  },
  {
    id: "theme_neon",
    name: "shop.items.neonGlowTheme",
    description: "shop.items.neonGlowThemeDesc",
    price: 600,
    category: "themes",
    icon: Zap,
    rarity: "legendary",
  },

  // Boosters
  {
    id: "booster_xp_2x",
    name: "shop.items.xpBooster2x",
    description: "shop.items.xpBooster2xDesc",
    price: 100,
    category: "boosters",
    icon: TrendingUp,
    rarity: "common",
  },
  {
    id: "booster_gems_2x",
    name: "shop.items.gemBooster2x",
    description: "shop.items.gemBooster2xDesc",
    price: 150,
    category: "boosters",
    icon: Gem,
    rarity: "rare",
  },
  {
    id: "booster_streak_protect",
    name: "shop.items.streakProtection",
    description: "shop.items.streakProtectionDesc",
    price: 200,
    category: "boosters",
    icon: Shield,
    rarity: "epic",
  },

  // Difficulties
  {
    id: "difficulty_extreme",
    name: "shop.items.extremeDifficulty",
    description: "shop.items.extremeDifficultyDesc",
    price: 800,
    category: "difficulties",
    icon: Flame,
    rarity: "legendary",
  },
  {
    id: "difficulty_nightmare",
    name: "shop.items.nightmareMode",
    description: "shop.items.nightmareModeDesc",
    price: 1500,
    category: "difficulties",
    icon: Crown,
    rarity: "legendary",
  },

  // Achievements
  {
    id: "achievement_collector",
    name: "shop.items.collectorAchievement",
    description: "shop.items.collectorAchievementDesc",
    price: 300,
    category: "achievements",
    icon: Trophy,
    rarity: "epic",
  },
  {
    id: "achievement_spender",
    name: "shop.items.generousSpender",
    description: "shop.items.generousSpenderDesc",
    price: 500,
    category: "achievements",
    icon: Gift,
    rarity: "legendary",
  },
];

const categories = [
  {
    id: "avatars",
    name: "shop.avatars",
    icon: User,
    description: "shop.avatarsDescription",
  },
  {
    id: "frames",
    name: "shop.frames",
    icon: Target,
    description: "shop.framesDescription",
  },
  {
    id: "themes",
    name: "shop.themes",
    icon: Palette,
    description: "shop.themesDescription",
  },
  {
    id: "boosters",
    name: "shop.boosters",
    icon: Rocket,
    description: "shop.boostersDescription",
  },
  {
    id: "difficulties",
    name: "shop.difficulties",
    icon: Flame,
    description: "shop.difficultiesDescription",
  },
  {
    id: "achievements",
    name: "shop.achievementsCategory",
    icon: Trophy,
    description: "shop.achievementsCategoryDescription",
  },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common":
      return "from-gray-500 to-slate-500";
    case "rare":
      return "from-blue-500 to-cyan-500";
    case "epic":
      return "from-purple-500 to-pink-500";
    case "legendary":
      return "from-yellow-500 to-orange-500";
    default:
      return "from-gray-500 to-slate-500";
  }
};

const getRarityBorder = (rarity: string) => {
  switch (rarity) {
    case "common":
      return "border-gray-500/30";
    case "rare":
      return "border-blue-500/30";
    case "epic":
      return "border-purple-500/30";
    case "legendary":
      return "border-yellow-500/30";
    default:
      return "border-gray-500/30";
  }
};

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("avatars");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { t } = useTranslation();

  const { data: stats } = useSWR<PlayerStats>("/api/player-stats");

  const filteredItems = shopItems.filter(
    (item) => item.category === selectedCategory,
  );

  const handlePurchase = async (item: ShopItem) => {
    if (!stats || stats.gems < item.price) return;

    setPurchasingId(item.id);

    try {
      // TODO: Implement purchase API
      console.log(`Purchasing ${item.name} for ${item.price} gems`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
            <h1 className="text-4xl font-bold text-white">
              {t("shop.gemShop")}
            </h1>
          </div>
          <p className="text-slate-300 text-lg">{t("shop.shopDescription")}</p>

          {/* Gem Balance */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30"
          >
            <Gem className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold text-white">
              {stats?.gems?.toLocaleString() || 0} {t("common.gems")}
            </span>
          </motion.div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-slate-800/50 border border-slate-700/50">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <category.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t(category.name)}</span>
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
                const category = categories.find(
                  (c) => c.id === selectedCategory,
                );
                return (
                  <div className="flex items-center gap-3">
                    {category && (
                      <category.icon className="w-5 h-5 text-purple-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">
                        {category?.name ? t(category.name) : ""}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {category?.description ? t(category.description) : ""}
                      </p>
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
                      stiffness: 100,
                    }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <Card
                      className={`h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 ${getRarityBorder(item.rarity)} backdrop-blur-sm overflow-hidden`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${getRarityColor(item.rarity)} shadow-lg`}
                          >
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
                          {t(item.name)}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {t(item.description)}
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
                              {t("shop.owned")}
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => handlePurchase(item)}
                              disabled={
                                !stats ||
                                stats.gems < item.price ||
                                purchasingId === item.id
                              }
                              className={`bg-gradient-to-r ${getRarityColor(item.rarity)} hover:scale-105 transition-all duration-200 text-white font-semibold`}
                              size="sm"
                            >
                              {purchasingId === item.id ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                >
                                  <Sparkles className="w-4 h-4" />
                                </motion.div>
                              ) : (
                                t("shop.buy")
                              )}
                            </Button>
                          )}
                        </div>

                        {!stats || stats.gems < item.price ? (
                          <p className="text-xs text-red-400">
                            {t("shop.notEnoughGems")}
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
                    {t("shop.noItemsInCategory")}
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
            <h3 className="text-xl font-bold text-white">
              {t("shop.comingSoon")}
            </h3>
            <p className="text-slate-300">{t("shop.comingSoonDescription")}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
