"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { SourceAnalysisResult } from "@/lib/ai/schemas";

interface SourceAnalysisProps {
  analysis: SourceAnalysisResult;
  processingTimeMs?: number;
  onProceedToReview: () => void;
}

export function SourceAnalysis({
  analysis,
  processingTimeMs,
  onProceedToReview,
}: SourceAnalysisProps) {
  const confidencePercent = Math.round(analysis.confidence * 100);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "text-emerald-400 border-emerald-800 bg-emerald-950/30";
    if (conf >= 0.5) return "text-amber-400 border-amber-800 bg-amber-950/30";
    return "text-red-400 border-red-800 bg-red-950/30";
  };

  const getConfidenceBarColor = (conf: number) => {
    if (conf >= 0.8) return "bg-emerald-500";
    if (conf >= 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Agent 1: Source Understanding Report
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                GLM-4 Reasoning
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous document perception and entity extraction
            </p>
          </div>
        </div>

        {processingTimeMs && (
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {processingTimeMs}ms
          </span>
        )}
      </div>

      {/* Confidence & Classification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Confidence Score */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Extraction Confidence</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getConfidenceColor(analysis.confidence)}`}>
              {confidencePercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full ${getConfidenceBarColor(analysis.confidence)} transition-all duration-500`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Computed dynamically based on field completeness and clarity.
          </p>
        </div>

        {/* Source Type */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400">Document Classification</span>
          <div className="text-sm font-semibold text-slate-200 mt-1 uppercase tracking-wide font-mono">
            {analysis.sourceType.replace("_", " ")}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analysis.eventDetected ? "✓ Verified Event Document" : "⚠ Ambiguous Event Signal"}
          </p>
        </div>

        {/* Recommended Next Actions */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400">Recommended Agent Actions</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {analysis.recommendedActions.map((act) => (
              <span
                key={act}
                className="text-[11px] font-mono px-2 py-0.5 bg-blue-950/50 text-blue-300 border border-blue-800/40 rounded"
              >
                {act.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          AI Content Summary
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          {analysis.summary}
        </p>
      </div>

      {/* Detected Core Entities */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Entity Extraction Status
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: "Event Name", detected: analysis.detectedEntities.hasTitle },
            { label: "Date", detected: analysis.detectedEntities.hasDate },
            { label: "Time", detected: analysis.detectedEntities.hasTime },
            { label: "Venue / Platform", detected: analysis.detectedEntities.hasVenue },
            { label: "Organizer", detected: analysis.detectedEntities.hasOrganizer },
          ].map((item) => (
            <div
              key={item.label}
              className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs ${
                item.detected
                  ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                  : "bg-slate-950/40 border-slate-800 text-slate-500"
              }`}
            >
              {item.detected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
              )}
              <span className="truncate font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={onProceedToReview}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <span>Proceed to Human Event Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
