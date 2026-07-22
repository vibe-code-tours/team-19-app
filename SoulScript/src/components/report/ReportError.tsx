"use client";

import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";

interface ReportErrorProps {
  message: string;
}

export default function ReportError({ message }: ReportErrorProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="report" />
      <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">😔</div>
          <h2 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary">
            Unable to load report
          </h2>
          <p className="text-sm text-text-secondary">
            {message || "Something went wrong while fetching your report."}
          </p>
          <button
            onClick={() => router.push("/calendar")}
            className="py-2.5 px-6 glass rounded-full text-sm font-medium text-text-primary hover:text-accent border border-glass-border transition-colors"
          >
            Back to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
