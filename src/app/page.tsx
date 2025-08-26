import HeroSection from "@/components/HeroSection";

export default async function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <HeroSection />
    </main>
  );
}
