import type { Metadata } from "next";
import MoodCalendar from "@/components/MoodCalendar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mood Calendar — SoulScript",
  description: "View your emotional journey on an interactive mood calendar.",
};

export default function CalendarPage() {
  return <MoodCalendar />;
}
