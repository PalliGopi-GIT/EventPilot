"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Brain,
  Zap,
} from "lucide-react";

export type AgentStepStatus = "completed" | "active" | "pending" | "error";

export interface AgentStep {
  id: string;
  label: string;
  sublabel?: string;
  stage: "PERCEIVE" | "UNDERSTAND" | "PLAN" | "APPROVE" | "EXECUTE" | "OBSERVE" | "REPORT";
  status: AgentStepStatus;
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
      return "active";
    }
    return "pending";
  };

  const steps: AgentStep[] = [
    {
      id: "source_received",
      label: "Ingest",
      sublabel: "Source received",
      stage: "PERCEIVE",
      status: getStepStatus("source_received"),
    },
    {
      id: "source_analyzed",
      label: "Analyze",
      sublabel: confidence ? `${(confidence * 100).toFixed(0)}% confidence` : "Extract entities",
      stage: "UNDERSTAND",
      status: getStepStatus("source_analyzed"),
    },
    {
      id: "event_extracted",
      label: "Review",
      sublabel: "Safety checkpoint",
      stage: "UNDERSTAND",
      status: getStepStatus("event_extracted"),
    },
    {
      id: "form_planned",
      label: "Plan",
      sublabel: "Form schema",
      stage: "PLAN",
      status: getStepStatus("form_planned"),
    },
    {
      id: "human_approval",
      label: "Approve",
      sublabel: "Human-in-the-Loop",
      stage: "APPROVE",
      status: getStepStatus("human_approval"),
    },
    {
      id: "google_form_created",
      label: "Deploy",
      sublabel: "Google Forms API",
      stage: "EXECUTE",
      status: getStepStatus("google_form_created"),
    },
    {
      id: "responses_observed",
      label: "Observe",
      sublabel: "Collect responses",
      stage: "OBSERVE",
      status: getStepStatus("responses_observed"),
    },
    {
      id: "insights_reported",
      label: "Report",
      sublabel: "Intelligence",
      stage: "REPORT",
      status: getStepStatus("insights_reported"),
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Agent Execution Loop
            </div>
            <p className="text-xs text-slate-400">
              Perceive → Understand → Plan → Approve → Execute → Observe → Report
            </p>
          </div>
        </div>

        {activeAction && (
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            <span>{activeAction}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {steps.map((step) => {
          const isCompleted = step.status === "completed";
          const isActive = step.status === "active";

          return (
            <div
              key={step.id}
              className={`flex flex-col p-3 rounded-lg border transition-all duration-200 ${
                isCompleted
                  ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-200"
                  : isActive
                  ? "bg-slate-800 border-slate-600 text-white"
                  : "bg-slate-900/30 border-slate-800/60 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[9px] font-semibold tracking-wider uppercase ${
                    isActive ? "text-slate-300" : isCompleted ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {step.stage}
                </span>

                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isActive && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400" />
                  </span>
                )}
                {step.status === "pending" && <Circle className="w-3 h-3 text-slate-700" />}
              </div>

              <div className="text-xs font-medium truncate text-slate-200">{step.label}</div>
              {step.sublabel && (
                <div
                  className={`text-[10px] truncate mt-0.5 ${
                    isActive ? "text-slate-400" : isCompleted ? "text-emerald-300/80" : "text-slate-500"
                  }`}
                >
                  {step.sublabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
