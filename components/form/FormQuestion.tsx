"use client";

import React from "react";
import {
  AlignLeft,
  CheckSquare,
  ChevronDownSquare,
  ListFilter,
  SlidersHorizontal,
  Type,
  Asterisk,
} from "lucide-react";
import type { QuestionDefinition } from "@/lib/ai/schemas";

interface FormQuestionProps {
  question: QuestionDefinition;
  index: number;
}

export function FormQuestion({ question, index }: FormQuestionProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "short_answer":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
            <Type className="w-3 h-3" /> Short Answer
          </span>
        );
      case "paragraph":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
            <AlignLeft className="w-3 h-3" /> Paragraph
          </span>
        );
      case "multiple_choice":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            <ListFilter className="w-3 h-3" /> Multiple Choice
          </span>
        );
      case "checkbox":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-800/40">
            <CheckSquare className="w-3 h-3" /> Checkbox
          </span>
        );
      case "dropdown":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
            <ChevronDownSquare className="w-3 h-3" /> Dropdown
          </span>
        );
      case "linear_scale":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
            <SlidersHorizontal className="w-3 h-3" /> Linear Scale ({question.scaleMin ?? 1}–{question.scaleMax ?? 5})
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 transition-all hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-medium text-slate-300">
            {index + 1}
          </span>
          <div>
            <div className="text-sm font-medium text-slate-100 flex items-center gap-1.5">
              {question.label}
              {question.required && (
                <span title="Required field" className="text-red-400 font-bold text-xs flex items-center">
                  *
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {getTypeBadge(question.type)}
          {question.required ? (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
              Required
            </span>
          ) : (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
              Optional
            </span>
          )}
        </div>
      </div>

      {/* Options or Scale Preview */}
      {question.options && question.options.length > 0 && (
        <div className="ml-8 pt-1 flex flex-wrap gap-1.5">
          {question.options.map((opt, oIdx) => (
            <span
              key={oIdx}
              className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono"
            >
              {opt}
            </span>
          ))}
        </div>
      )}

      {question.type === "linear_scale" && (
        <div className="ml-8 pt-1 flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>{question.scaleLowLabel || "Min"} ({question.scaleMin ?? 1})</span>
          <div className="flex gap-1">
            {Array.from({ length: (question.scaleMax ?? 5) - (question.scaleMin ?? 1) + 1 }).map((_, i) => (
              <span key={i} className="w-5 h-5 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                {(question.scaleMin ?? 1) + i}
              </span>
            ))}
          </div>
          <span>{question.scaleHighLabel || "Max"} ({question.scaleMax ?? 5})</span>
        </div>
      )}
    </div>
  );
}
