import type { Metadata } from "next";
import BookingChat from "@/components/BookingChat";

export const metadata: Metadata = {
  title: "Book a Meeting",
  description: "Schedule a meeting with Oleg Polyakov using the AI scheduling assistant.",
};

export default function BookPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Book a Meeting</h1>
      <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
        Chat with the scheduling assistant below to find a time that works.
        It can answer questions about my availability, meeting types, and help you confirm a slot.
      </p>
      <div className="mt-8" style={{ height: "min(560px, calc(100dvh - 18rem))" }}>
        <BookingChat />
      </div>
    </main>
  );
}
