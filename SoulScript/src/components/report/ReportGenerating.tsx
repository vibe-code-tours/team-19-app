"use client";

import { Loader2 } from "lucide-react";
import NavBar from "@/components/NavBar";

export default function ReportGenerating() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="report" />
      <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <Loader2 size={32} className="text-accent animate-spin mx-auto" />
          <h2 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary">
            Generating your reflection...
          </h2>
          <p className="text-sm text-text-secondary">
            AI is analyzing your journal entries. This may take a moment.
          </p>
        </div>
      </div>
    </div>
  );
}
