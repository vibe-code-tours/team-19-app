"use client";

import NavBar from "@/components/NavBar";

export default function ReportSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="report" />
      <div className="flex-1 px-5 md:px-10 lg:px-10 pb-10 max-w-5xl mx-auto w-full">
        <div className="p-6 md:p-10 rounded-2xl">
          <div className="bg-background rounded-2xl p-6 md:p-8 space-y-7">
            {/* Header skeleton */}
            <div className="text-center space-y-3 pt-2">
              <div className="skeleton w-12 h-12 rounded-3xl mx-auto" />
              <div className="skeleton h-7 w-48 mx-auto rounded-lg" />
              <div className="skeleton h-4 w-64 mx-auto rounded-lg" />
              <div className="skeleton h-3 w-40 mx-auto rounded-lg" />
            </div>
            <div className="h-px bg-white/5" />
            {/* Top section — two columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-5">
              {/* Big picture skeleton */}
              <div className="space-y-3">
                <div className="skeleton h-3 w-32 rounded-lg" />
                <div className="glass rounded-2xl p-8 space-y-4">
                  <div className="skeleton w-12 h-12 rounded-full mx-auto" />
                  <div className="skeleton h-6 w-24 mx-auto rounded-lg" />
                  <div className="skeleton h-4 w-64 mx-auto rounded-lg" />
                </div>
              </div>
              {/* Mood distribution skeleton */}
              <div className="space-y-3">
                <div className="skeleton h-3 w-40 rounded-lg" />
                <div className="glass rounded-2xl p-5 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between">
                        <div className="skeleton h-4 w-20 rounded-lg" />
                        <div className="skeleton h-4 w-8 rounded-lg" />
                      </div>
                      <div className="skeleton h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Bottom section — two columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-5">
              {/* Pattern recognition skeleton */}
              <div className="space-y-3">
                <div className="skeleton h-3 w-36 rounded-lg" />
                <div className="glass rounded-2xl p-5 space-y-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3.5">
                      <div className="w-0.5 shrink-0 rounded-full skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-20 rounded-lg" />
                        <div className="skeleton h-3 w-full rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Emotional rhythm + moment skeletons */}
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="skeleton h-3 w-44 rounded-lg" />
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="glass rounded-xl p-4 border-l-[3px] border-l-accent"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1.5">
                            <div className="skeleton h-3 w-24 rounded-lg" />
                            <div className="skeleton h-4 w-32 rounded-lg" />
                          </div>
                          <div className="skeleton w-8 h-8 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="skeleton h-3 w-40 rounded-lg" />
                  <div className="glass rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="skeleton w-6 h-6 rounded-full" />
                      <div className="skeleton h-3 w-20 rounded-lg" />
                    </div>
                    <div className="skeleton h-4 w-full rounded-lg" />
                    <div className="skeleton h-3 w-48 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
            {/* Actionable frameworks skeleton */}
            <div className="space-y-3">
              <div className="skeleton h-3 w-44 rounded-lg" />
              <div className="skeleton h-3 w-64 rounded-lg" />
              <div className="space-y-2.5">
                {[1, 2].map((i) => (
                  <div key={i} className="glass rounded-xl p-4 flex items-start gap-3">
                    <div className="skeleton w-6 h-6 rounded-full shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-4 w-32 rounded-lg" />
                      <div className="skeleton h-3 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Closing reflection skeleton */}
            <div className="glass rounded-2xl p-6 text-center space-y-3">
              <div className="skeleton w-10 h-10 rounded-full mx-auto" />
              <div className="skeleton h-3 w-3/4 mx-auto rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
