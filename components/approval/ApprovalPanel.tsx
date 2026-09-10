"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe,
  UserCheck,
  FileCheck,
  Loader2,
  ExternalLink,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import type { FormDefinition, ActionPlan } from "@/lib/ai/schemas";

interface ApprovalPanelProps {
  form: FormDefinition & { id: string; googleFormUrl?: string | null; googleResponderUri?: string | null };
  actionPlan: ActionPlan;
  googleConnected: boolean;
  googleEmail?: string | null;
  onConnectGoogle: () => void;
  onApproveAndCreate: (requestId: string) => Promise<void>;
  onCancel: () => void;
  isDeploying: boolean;
  deploymentResult?: {
    formUrl: string;
    responderUri: string;
    googleFormId: string;
  } | null;
  error?: string | null;
}

export function ApprovalPanel({
  form,
  actionPlan,
  googleConnected,
  googleEmail,
  onConnectGoogle,
  onApproveAndCreate,
  onCancel,
  isDeploying,
  deploymentResult,
  error,
}: ApprovalPanelProps) {
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleApprove = async () => {
    // Generate unique client idempotency requestId
    const requestId = `req_${form.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await onApproveAndCreate(requestId);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              4. Human Authorization & Action Gate
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/40 font-mono font-normal">
                Strict Approval Required
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              No external service is modified without your explicit verified authorization.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success State if already deployed */}
      {deploymentResult ? (
        <div className="p-6 bg-emerald-950/20 border border-emerald-800/50 rounded-xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-emerald-300">
              Real Google Form Deployed Successfully!
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Created directly in Google Drive under{" "}
              <span className="font-mono text-emerald-400">{googleEmail || "connected account"}</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <a
              href={deploymentResult.responderUri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
            >
              <span>Open Participant Form (Submit Responses)</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={deploymentResult.formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
            >
              <span>Edit in Google Forms Editor</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Action Execution Manifest Table (Section 16) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
            <div className="grid grid-cols-3 p-3.5 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">ACTION</span>
              <span className="col-span-2 font-mono text-slate-100 font-semibold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-400" />
                CREATE_GOOGLE_FORM ({actionPlan.formType})
              </span>
            </div>

            <div className="grid grid-cols-3 p-3.5 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">FORM TITLE</span>
              <span className="col-span-2 text-slate-200 font-medium">{form.title}</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">QUESTIONS</span>
              <span className="col-span-2 text-slate-200 font-mono">
                {form.questions.length} Items (Short Answer, Paragraph, Scales, Choices)
              </span>
            </div>

            <div className="grid grid-cols-3 p-3.5 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">EXTERNAL SERVICE</span>
              <span className="col-span-2 text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                Google Forms API v1 (via user-delegated OAuth token)
              </span>
            </div>

            <div className="grid grid-cols-3 p-3.5 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">TARGET ACCOUNT</span>
              <div className="col-span-2 flex items-center justify-between">
                {googleConnected ? (
                  <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    {googleEmail}
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    OAuth Connection Required
                  </span>
                )}

                {!googleConnected && (
                  <button
                    type="button"
                    onClick={onConnectGoogle}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow-sm transition-all cursor-pointer"
                  >
                    Connect Google Account
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Idempotency & Safety Notice */}
          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Idempotency Enforced:</strong> Each creation request uses a cryptographic client UUID to prevent double-creations during network retries.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="confirmApprove"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="confirmApprove" className="text-xs text-slate-200 cursor-pointer font-medium">
                I have reviewed the form specification and authorize Google Forms creation.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all cursor-pointer"
            >
              Back to Form Builder
            </button>

            <button
              type="button"
              disabled={isDeploying || !googleConnected || !hasConfirmed}
              onClick={handleApprove}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Google Forms API...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve & Deploy to Google Forms</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
