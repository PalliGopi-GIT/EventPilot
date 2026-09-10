"use client";

import React from "react";
import { Tag, ThumbsUp, MessageSquare, Quote } from "lucide-react";
import type { ThemeItem } from "@/lib/ai/schemas";

interface ThemesProps {
  themes: ThemeItem[];
  topStrengths: string[];
  commonSuggestions: string[];
}

export function Themes({ themes, topStrengths, commonSuggestions }: ThemesProps) {
  const getThemeSentimentBadge = (sent: string) => {
    switch (sent) {
      case "POSITIVE":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-800/40";
      case "NEGATIVE":
        return "bg-red-950/40 text-red-400 border-red-800/40";
      case "MIXED":
        return "bg-amber-950/40 text-amber-400 border-amber-800/40";
      default:
        return "bg-slate-900 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Strengths */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <ThumbsUp className="w-4 h-4" />
          Key Strengths Highlighted by Attendees
        </div>

        {topStrengths.length > 0 ? (
          <div className="space-y-2">
            {topStrengths.map((str, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-200 flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{str}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No specific strengths identified yet.</p>
        )}
      </div>

      {/* Common Suggestions */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <MessageSquare className="w-4 h-4" />
          Common Attendee Suggestions & Critique
        </div>

        {commonSuggestions.length > 0 ? (
          <div className="space-y-2">
            {commonSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-200 flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/50 flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{sug}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No suggestions submitted yet.</p>
        )}
      </div>

      {/* Extracted Recurring Themes */}
      {themes.length > 0 && (
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <Tag className="w-4 h-4" />
            Detected Semantic Themes & Sentiment Clusters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {themes.map((th, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-slate-200">{th.theme}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getThemeSentimentBadge(
                      th.sentiment
                    )}`}
                  >
                    {th.sentiment} ({th.count})
                  </span>
                </div>

                {th.exampleQuotes && th.exampleQuotes.length > 0 && (
                  <div className="pt-1 border-t border-slate-900 space-y-1">
                    {th.exampleQuotes.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="text-[11px] text-slate-400 italic flex items-start gap-1"
                      >
                        <Quote className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                        <span>"{q}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
