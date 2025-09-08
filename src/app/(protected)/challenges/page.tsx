import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";

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
      <Card
        className={`relative overflow-hidden ${
          challenge.completed ? "bg-green-50 border-green-200" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  type === "daily"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {type === "daily" ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{challenge.title}</CardTitle>
                <CardDescription className="text-sm">
                  {challenge.description}
                </CardDescription>
              </div>
            </div>
            {challenge.completed && (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fortschritt</span>
              <span className="font-medium">
                {challenge.progress}/{challenge.target}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  {challenge.xpReward} XP
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
                <span className="text-sm font-medium">
                  {challenge.gemReward} Gems
                </span>
              </div>
            </div>

            <Badge
              variant={challenge.completed ? "default" : "secondary"}
              className="text-xs"
            >
              {challenge.completed ? "Abgeschlossen" : challenge.timeLeft}
            </Badge>
          </div>
        </CardContent>

        {challenge.completed && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500 transform rotate-45 translate-x-8 -translate-y-8">
            <Trophy className="w-4 h-4 text-white absolute bottom-2 left-2 transform -rotate-45" />
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Herausforderungen</h1>
        <p className="text-muted-foreground">
          Stelle dich täglichen und wöchentlichen Herausforderungen und verdiene
          zusätzliche Belohnungen!
        </p>
      </div>

      {/* Daily Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-semibold">Tägliche Herausforderungen</h2>
          <Badge variant="outline" className="ml-2">
            Erneuert in 4h 23m
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dailyChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              type="daily"
            />
          ))}
        </div>
      </section>

      {/* Weekly Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h2 className="text-2xl font-semibold">
            Wöchentliche Herausforderungen
          </h2>
          <Badge variant="outline" className="ml-2">
            Erneuert in 3d 12h
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weeklyChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              type="weekly"
            />
          ))}
        </div>
      </section>

      {/* Stats Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Herausforderungs-Statistiken</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Heute abgeschlossen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1/3</div>
              <p className="text-xs text-muted-foreground">+75 XP verdient</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Diese Woche abgeschlossen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0/3</div>
              <p className="text-xs text-muted-foreground">0 XP verdient</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamt-Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7 Tage</div>
              <p className="text-xs text-muted-foreground">
                Persönlicher Rekord!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
