"use client";

import React from "react";
import { Users, Star, TrendingUp, Sparkles } from "lucide-react";
import type { ResponseAnalysisResult } from "@/lib/ai/schemas";

interface ResponseStatsProps {
  analysis: ResponseAnalysisResult;
  responseCount: number;
}

export function ResponseStats({ analysis, responseCount }: ResponseStatsProps) {
  const getSentimentBadge = (sent: string) => {
    switch (sent) {
      case "POSITIVE":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
      case "NEUTRAL":
        return "bg-blue-950/60 text-blue-300 border-blue-800/60";
      case "MIXED":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      case "NEGATIVE":
        return "bg-red-950/60 text-red-300 border-red-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Responses */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Total Responses</span>
          <Users className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-100">
          {analysis.totalResponses || responseCount}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Live submissions from Google Form</p>
      </div>

      {/* Average Rating */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Average Rating</span>
          <Star className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-300">
          {analysis.averageRating ? `${analysis.averageRating.toFixed(1)} / 5.0` : "N/A"}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Computed from linear scale questions</p>
      </div>

      {/* Sentiment Classification */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Overall Sentiment</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-1">
          <span
            className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-bold border ${getSentimentBadge(
              analysis.sentiment
            )}`}
          >
            {analysis.sentiment}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Synthesized across attendee comments</p>
      </div>

      {/* AI Confidence */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Analysis Status</span>
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-sm font-semibold text-indigo-300 mt-1 font-mono">
          GLM-4 Real Intelligence
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Zero fabricated data</p>
      </div>
    </div>
  );
}
