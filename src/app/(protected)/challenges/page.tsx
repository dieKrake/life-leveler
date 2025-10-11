import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trophy, Zap, CheckCircle2, Gem } from "lucide-react";

export default function ChallengesPage() {
  // Mock data for daily challenges
  const dailyChallenges = [
    {
      id: 1,
      title: "Komm in die Gänge",
      description: "Erledige dein erstes Todo",
      progress: 0,
      target: 1,
      xpReward: 50,
      gemReward: 2,
      completed: false,
      timeLeft: "4h 23m",
    },
    {
      id: 2,
      title: "Früher Vogel",
      description: "Erledige 3 Todos vor 12:00 Uhr",
      progress: 2,
      target: 3,
      xpReward: 50,
      gemReward: 2,
      completed: false,
      timeLeft: "4h 23m",
    },
    {
      id: 3,
      title: "Schwere Aufgaben",
      description: "Erledige 2 Hard-Difficulty Todos",
      progress: 0,
      target: 2,
      xpReward: 100,
      gemReward: 5,
      completed: false,
      timeLeft: "4h 23m",
    },
    {
      id: 4,
      title: "Wochenkrieger",
      description: "Erledige 25 Todos diese Woche",
      progress: 0,
      target: 25,
      xpReward: 300,
      gemReward: 5,
      completed: false,
      timeLeft: "4h 23m",
    },
  ];

  // Mock data for weekly challenges
  const weeklyChallenges = [
    {
      id: 4,
      title: "Wochenkrieger",
      description: "Erledige 25 Todos diese Woche",
      progress: 18,
      target: 25,
      xpReward: 300,
      gemReward: 15,
      completed: false,
      timeLeft: "3d 12h",
    },
    {
      id: 5,
      title: "Konsistenz-Meister",
      description: "Erledige jeden Tag mindestens 3 Todos",
      progress: 5,
      target: 7,
      xpReward: 250,
      gemReward: 12,
      completed: false,
      timeLeft: "3d 12h",
    },
    {
      id: 6,
      title: "XP-Sammler",
      description: "Sammle 500 XP diese Woche",
      progress: 350,
      target: 500,
      xpReward: 200,
      gemReward: 10,
      completed: false,
      timeLeft: "3d 12h",
    },
  ];

  const ChallengeCard = ({
    challenge,
    type,
  }: {
    challenge: any;
    type: "daily" | "weekly";
  }) => {
    const progressPercentage = (challenge.progress / challenge.target) * 100;

    return (
      <div
        className={`relative overflow-hidden h-full flex flex-col justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm ${
          challenge.completed ? "border-green-500/50" : ""
        }`}
      >
        <div className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  type === "daily"
                    ? "bg-blue-500/20 border border-blue-500/30"
                    : "bg-purple-500/20 border border-purple-500/30"
                }`}
              >
                {type === "daily" ? (
                  <Clock className="w-5 h-5 text-blue-400" />
                ) : (
                  <Calendar className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {challenge.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {challenge.description}
                </p>
              </div>
            </div>
            {challenge.completed && (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            )}
          </div>
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-center">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Fortschritt</span>
              <span className="font-medium text-white">
                {challenge.progress}/{challenge.target}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                  {challenge.xpReward} XP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">
                  {challenge.gemReward} Gems
                </span>
              </div>
            </div>

            <Badge
              variant={challenge.completed ? "default" : "secondary"}
              className={`text-xs ${
                challenge.completed
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-slate-700/50 text-slate-300 border-slate-600/50"
              }`}
            >
              {challenge.completed ? "Abgeschlossen" : challenge.timeLeft}
            </Badge>
          </div>
        </div>

        {challenge.completed && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/30 transform rotate-45 translate-x-8 -translate-y-8 border-l border-b border-green-400/50">
            <Trophy className="w-4 h-4 text-green-400 absolute bottom-2 left-2 transform -rotate-45" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Herausforderungen</h1>
          <p className="text-slate-300 text-lg">
            Stelle dich täglichen und wöchentlichen Herausforderungen und
            verdiene zusätzliche Belohnungen!
          </p>
        </div>

        {/* Daily Challenges */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold text-white">
              Tägliche Herausforderungen
            </h2>
            <Badge
              variant="outline"
              className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/30"
            >
              Erneuert in 4h 23m
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4 min-w-max">
              {dailyChallenges.map((challenge) => (
                <div key={challenge.id} className="flex-none w-80 h-52">
                  <ChallengeCard challenge={challenge} type="daily" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Weekly Challenges */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-semibold text-white">
              Wöchentliche Herausforderungen
            </h2>
            <Badge
              variant="outline"
              className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30"
            >
              Erneuert in 3d 12h
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4 min-w-max">
              {weeklyChallenges.map((challenge) => (
                <div key={challenge.id} className="flex-none w-80 h-52">
                  <ChallengeCard challenge={challenge} type="weekly" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
