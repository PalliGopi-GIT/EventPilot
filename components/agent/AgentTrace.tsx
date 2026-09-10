"use client";

import React from "react";
import {
  CheckCircle2,
  CircleDot,
  Circle,
  AlertCircle,
  Brain,
  ShieldCheck,
  Send,
  BarChart3,
  Sparkles,
} from "lucide-react";

export type AgentStepStatus = "completed" | "active" | "pending" | "error";

export interface AgentStep {
  id: string;
  label: string;
  sublabel?: string;
  stage: "PERCEIVE" | "UNDERSTAND" | "PLAN" | "APPROVE" | "EXECUTE" | "OBSERVE" | "REPORT";
  status: AgentStepStatus;
  timestamp?: string;
}

interface AgentTraceProps {
  currentStage: "source" | "event" | "form" | "approval" | "success" | "responses" | "insights";
  isProcessing?: boolean;
  activeAction?: string;
  confidence?: number;
}

export function AgentTrace({
  currentStage,
  isProcessing = false,
  activeAction,
  confidence,
}: AgentTraceProps) {
  // Derive deterministic real steps based on actual current stage
  const getStepStatus = (stepId: string): AgentStepStatus => {
    const stageOrder = ["source", "event", "form", "approval", "success", "responses", "insights"];
    const currentIndex = stageOrder.indexOf(currentStage);

    const stepStageMap: Record<string, number> = {
      source_received: 0,
      source_analyzed: 1,
      event_extracted: 1,
      form_planned: 2,
      human_approval: 3,
      google_form_created: 4,
      responses_observed: 5,
      insights_reported: 6,
    };

    const stepIndex = stepStageMap[stepId] ?? 0;

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) {
      return isProcessing ? "active" : "active";
    }
    return "pending";
  };

  const steps: AgentStep[] = [
    {
      id: "source_received",
      label: "Perceive: Ingest Source",
      sublabel: "Poster / Doc / Text parsed",
      stage: "PERCEIVE",
      status: getStepStatus("source_received"),
    },
    {
      id: "source_analyzed",
      label: "Understand: Agent 1 Reasoning",
      sublabel: confidence ? `Confidence: ${(confidence * 100).toFixed(0)}%` : "Classify & extract entities",
      stage: "UNDERSTAND",
      status: getStepStatus("source_analyzed"),
    },
    {
      id: "event_extracted",
      label: "Safety: Human Event Review",
      sublabel: "Verify event parameters",
      stage: "UNDERSTAND",
      status: getStepStatus("event_extracted"),
    },
    {
      id: "form_planned",
      label: "Plan: GLM Form Architect",
      sublabel: "Synthesize form & action plan",
      stage: "PLAN",
      status: getStepStatus("form_planned"),
    },
    {
      id: "human_approval",
      label: "Approve: Human-in-the-Loop",
      sublabel: "Explicit authorization gate",
      stage: "APPROVE",
      status: getStepStatus("human_approval"),
    },
    {
      id: "google_form_created",
      label: "Execute: Google Forms API",
      sublabel: "Deterministic deployment",
      stage: "EXECUTE",
      status: getStepStatus("google_form_created"),
    },
    {
      id: "responses_observed",
      label: "Observe: Fetch Live Responses",
      sublabel: "Real participant submissions",
      stage: "OBSERVE",
      status: getStepStatus("responses_observed"),
    },
    {
      id: "insights_reported",
      label: "Report: GLM Response Intelligence",
      sublabel: "Synthesize themes & stats",
      stage: "REPORT",
      status: getStepStatus("insights_reported"),
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Agent Execution Loop
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50 font-mono font-normal">
                Autonomous + Human-Gated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic state machine tracking GLM & API actions
            </p>
          </div>
        </div>

        {activeAction && (
          <div className="text-xs font-mono px-2.5 py-1 bg-slate-800 rounded text-slate-300 border border-slate-700">
            {activeAction}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`flex flex-col p-2.5 rounded-lg border transition-all ${
              step.status === "completed"
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                : step.status === "active"
                ? "bg-blue-950/40 border-blue-600 text-blue-200 shadow-sm shadow-blue-500/10"
                : "bg-slate-900/40 border-slate-800/60 text-slate-500"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-semibold tracking-wider uppercase opacity-70">
                {step.stage}
              </span>
              {step.status === "completed" && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {step.status === "active" && (
                <CircleDot className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              )}
              {step.status === "pending" && <Circle className="w-3.5 h-3.5 text-slate-600" />}
            </div>

            <div className="text-xs font-medium truncate" title={step.label}>
              {step.label.split(":")[1]?.trim() || step.label}
            </div>
            {step.sublabel && (
              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={step.sublabel}>
                {step.sublabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
