import CalendarView from "@/components/CalendarView";

export default async function Calendar() {
  return (
    <main className="flex py-4 md:py-8 flex-col justify-center px-4">
      <CalendarView />
    </main>
  );
}
