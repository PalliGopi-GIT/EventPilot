"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  Layers,
  CheckCircle,
} from "lucide-react";
import { FormQuestion } from "./FormQuestion";
import { NaturalLanguageEditor } from "./NaturalLanguageEditor";
import type { FormDefinition, ActionPlan } from "@/lib/ai/schemas";

interface FormBuilderProps {
  form: FormDefinition & { id?: string };
  actionPlan?: ActionPlan | null;
  onModifyForm: (instruction: string) => Promise<string | void>;
  onProceedToApproval: () => void;
  isModifying: boolean;
  lastExplanation?: string | null;
}

export function FormBuilder({
  form,
  actionPlan,
  onModifyForm,
  onProceedToApproval,
  isModifying,
  lastExplanation,
}: FormBuilderProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              3. Form Specification & AI Refinement
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/40 font-mono">
              {form.formType} FORM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Synthesized form structure with {form.questions.length} questions. Use the Conversational Editor below to tweak.
          </p>
        </div>

        <button
          onClick={onProceedToApproval}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer flex-shrink-0"
        >
          <span>Proceed to Human Approval</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Form Metadata Display */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">{form.title}</h3>
          <span className="text-xs font-mono text-slate-400">
            {form.questions.length} Questions
          </span>
        </div>
        {form.description && (
          <p className="text-xs text-slate-300 font-sans">{form.description}</p>
        )}
      </div>

      {/* Natural Language Form Editor */}
      <NaturalLanguageEditor
        onModifyForm={onModifyForm}
        isLoading={isModifying}
        lastExplanation={lastExplanation}
      />

      {/* Questions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            Generated Question Schema ({form.questions.length})
          </h4>
        </div>

        <div className="space-y-2.5">
          {form.questions.map((question, idx) => (
            <FormQuestion key={question.id || idx} question={question} index={idx} />
          ))}
        </div>
      </div>

      {/* Action Plan Preview Card */}
      {actionPlan && (
        <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Agent 2 Deterministic Action Plan Prepared
            </span>
            <span className="font-mono text-emerald-400 font-medium">Ready for Human Approval</span>
          </div>
          <p className="text-slate-300">
            Target Service: <strong className="text-white">{actionPlan.provider}</strong> • Question Count:{" "}
            <strong className="text-white">{actionPlan.questionCount}</strong> • Target Account:{" "}
            <span className="font-mono text-blue-200">{actionPlan.targetAccount || "User's Google Account"}</span>
          </p>
        </div>
      )}

      {/* Bottom Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onProceedToApproval}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <span>Approve Plan & Proceed to Deployment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
