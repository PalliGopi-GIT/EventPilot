"use client";

import React from "react";
import { Lightbulb, CheckCircle, ArrowRight } from "lucide-react";

interface RecommendationsProps {
  recommendations: string[];
  keyTakeaways: string[];
}

export function Recommendations({
  recommendations,
  keyTakeaways,
}: RecommendationsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Actionable Recommendations */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Lightbulb className="w-4 h-4" />
          AI Recommendations for Future Events
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-2.5">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-indigo-950/20 border border-indigo-800/40 rounded-lg text-xs text-slate-200 flex items-start gap-2.5"
              >
                <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No recommendations generated.</p>
        )}
      </div>

      {/* Key Takeaways */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
          <CheckCircle className="w-4 h-4" />
          Executive Event Summary
        </div>

        {keyTakeaways && keyTakeaways.length > 0 ? (
          <div className="space-y-2.5">
            {keyTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                <span className="leading-relaxed">{takeaway}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No executive summary available.</p>
        )}
      </div>
    </div>
  );
}
