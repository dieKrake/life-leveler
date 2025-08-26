import CalendarView from "@/components/CalendarView";

export default async function Calendar() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <CalendarView />
    </main>
  );
}
