"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  FileCheck,
  Send,
  Eye,
  BarChart,
  Lock,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  FileText,
} from "lucide-react";

interface ProductNarrativeProps {
  onSelectSampleTemplate?: (templateType: string) => void;
}

export function ProductNarrative({ onSelectSampleTemplate }: ProductNarrativeProps) {
  const steps = [
    {
      step: "01",
      title: "Perceive & Understand",
      actor: "Agent 1 • GLM-4 Multimodal",
      description:
        "Ingests messy posters, PDF schedules, or raw announcements. Extracts structured title, dates, venues, organizers, and calculates real confidence.",
      icon: Brain,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      step: "02",
      title: "Human Safety Checkpoint",
      actor: "Organizer In-the-Loop",
      description:
        "Review and refine detected parameters. Select form objective (Registration vs Feedback) and add custom organizer guidance.",
      icon: Shield,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      step: "03",
      title: "Plan & NL Refinement",
      actor: "Form Architect & Conversational Editor",
      description:
        "GLM synthesizes rich question schemas (rating scales, checkboxes, text fields). Refine naturally: 'Add phone number', 'Make email mandatory'.",
      icon: Sparkles,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      step: "04",
      title: "Authorize & Deploy",
      actor: "Agent 2 Action Plan • Google Forms API",
      description:
        "Review deterministic action plan. With explicit 1-click human approval and idempotency protection, deploys directly to your Google account.",
      icon: Send,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      step: "05",
      title: "Observe & Report",
      actor: "Response Sync & GLM Intelligence",
      description:
        "Collect real submissions from participants. GLM synthesizes genuine rating trends, recurring themes, sentiment clusters, and executive recommendations.",
      icon: BarChart,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  const samplePresets = [
    {
      title: "AI Agents & LLMs Workshop",
      type: "Workshop",
      format: "Registration Form",
      description: "Hands-on 2-day developer bootcamp with coding prerequisites.",
    },
    {
      title: "Global Tech Summit 2026",
      type: "Conference",
      format: "Attendee Feedback",
      description: "Keynote ratings, track feedback, venue logistics, speaker clarity.",
    },
    {
      title: "Autonomous Systems Hackathon",
      type: "Hackathon",
      format: "Team Registration",
      description: "Track selection, team roster, GitHub links, hardware requirements.",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16">
      {/* Narrative Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-blue-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>The Autonomous Event Automation Pipeline</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Designed for absolute precision, zero hallucination, and total human control.
        </h2>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Unlike brittle scripting or uncontrolled AI tools, EventPilot operates as a deterministic
          agentic state machine with cryptographic authorization gates at every external boundary.
        </p>
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                    {item.step}
                  </span>
                  <div className={`p-2 rounded-xl border ${item.bg} ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                <div className="text-[11px] font-mono text-blue-400">{item.actor}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch Pre-configured Samples */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              1-Click Sample Blueprints
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Test the end-to-end agent reasoning loop instantly with pre-verified event sources.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {samplePresets.map((preset) => (
            <div
              key={preset.title}
              className="p-4 bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/50 rounded-xl flex flex-col justify-between gap-4 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 font-mono">
                    {preset.type}
                  </span>
                  <span className="text-slate-400">{preset.format}</span>
                </div>
                <div className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors">
                  {preset.title}
                </div>
                <p className="text-xs text-slate-400">{preset.description}</p>
              </div>

              <button
                onClick={() => onSelectSampleTemplate?.(preset.title)}
                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-blue-500 transition-all cursor-pointer"
              >
                <span>Load Sample Source</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
