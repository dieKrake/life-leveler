"use client";

import { motion } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trophy, 
  Target, 
  Zap, 
  Gem, 
  Star, 
  Crown,
  Sparkles,
  TrendingUp,
  CheckSquare
} from "lucide-react";

export default function LoginPage() {
  const supabase = createClientComponentClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes:
          "https://www.googleapis.com/auth/calendar profile email https://www.googleapis.com/auth/tasks",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const features = [
    {
      icon: CheckSquare,
      title: "Smart Todo Management",
      description: "Organisiere deine Aufgaben mit intelligenten Kategorien und Prioritäten",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Trophy,
      title: "Gamification System",
      description: "Sammle XP, steige in Leveln auf und verdiene Edelsteine für deine Erfolge",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "Achievements & Challenges",
      description: "Erreiche Meilensteine und meistere tägliche sowie wöchentliche Herausforderungen",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Sparkles,
      title: "Prestige System",
      description: "Erreiche das Maximum und starte mit Prestige-Boni neu durch",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding & Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Logo & Title */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center justify-center lg:justify-start gap-3 mb-4"
              >
                <div className="relative">
                  <Crown className="w-12 h-12 text-yellow-400" />
                  <Sparkles className="w-6 h-6 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Life Leveler
                </h1>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-slate-300 mb-8"
              >
                Verwandle dein Leben in ein Spiel und erreiche deine Ziele mit Spaß und Motivation!
              </motion.p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color} shadow-lg`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center justify-center lg:justify-start gap-6 pt-4"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-slate-300">Sammle XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-300">Verdiene Gems</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-slate-300">Erreiche Prestige</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center"
          >
            <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <CardTitle className="text-2xl font-bold text-white">
                    Willkommen zurück!
                  </CardTitle>
                  <p className="text-slate-400 mt-2">
                    Melde dich an und setze deine Reise fort
                  </p>
                </motion.div>

                {/* Animated Icons */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.0 }}
                  className="flex justify-center gap-4 py-4"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                  >
                    <Trophy className="w-6 h-6 text-purple-400" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      y: [0, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 2.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.5
                    }}
                    className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                  >
                    <Target className="w-6 h-6 text-blue-400" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 1
                    }}
                    className="p-3 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
                  >
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </motion.div>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <Button
                    onClick={handleGoogleLogin}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Mit Google anmelden
                    </motion.div>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                  className="text-center"
                >
                  <p className="text-xs text-slate-500">
                    Durch die Anmeldung stimmst du unseren{" "}
                    <span className="text-purple-400 hover:text-purple-300 cursor-pointer">
                      Nutzungsbedingungen
                    </span>{" "}
                    zu
                  </p>
                </motion.div>

                {/* Preview Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                  className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">1000+</div>
                    <div className="text-xs text-slate-500">Aktive User</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">50K+</div>
                    <div className="text-xs text-slate-500">Todos erledigt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">200+</div>
                    <div className="text-xs text-slate-500">Achievements</div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
