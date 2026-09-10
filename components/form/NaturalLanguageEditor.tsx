"use client";

import React, { useState } from "react";
import { MessageSquare, Sparkles, Send, Loader2, CheckCircle2, History } from "lucide-react";

interface NaturalLanguageEditorProps {
  onModifyForm: (instruction: string) => Promise<string | void>;
  isLoading: boolean;
  lastExplanation?: string | null;
}

export function NaturalLanguageEditor({
  onModifyForm,
  isLoading,
  lastExplanation,
}: NaturalLanguageEditorProps) {
  const [instruction, setInstruction] = useState("");

  const suggestions = [
    "Add phone number (short answer)",
    "Make email mandatory",
    "Add a 1–5 linear scale rating question",
    "Add dietary restrictions question",
    "Make this form shorter and more concise",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isLoading) return;

    const currentInst = instruction.trim();
    setInstruction("");
    await onModifyForm(currentInst);
  };

  const handleSuggestionClick = async (sug: string) => {
    if (isLoading) return;
    await onModifyForm(sug);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400 border border-blue-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              Natural Language Form Editor
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                Conversational GLM Refinement
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Instruct the AI in plain English to add, adjust, require, or remove questions.
            </p>
          </div>
        </div>
      </div>

      {lastExplanation && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg flex items-start gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold font-mono uppercase text-[10px] block text-emerald-400 mb-0.5">
              AI Action Applied:
            </span>
            <span>{lastExplanation}</span>
          </div>
        </div>
      )}

      {/* Suggestion Chips */}
      <div>
        <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick Prompts:</span>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              disabled={isLoading}
              onClick={() => handleSuggestionClick(sug)}
              className="text-xs px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-md transition-all cursor-pointer font-sans"
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. 'Add a question asking what topics they want in the next workshop'"
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !instruction.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
