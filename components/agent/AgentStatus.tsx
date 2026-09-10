"use client";

import React from "react";
import { Cpu, ShieldAlert, CheckCircle, Database, Key } from "lucide-react";

interface AgentStatusProps {
  modelName?: string;
  isOnline?: boolean;
  googleConnected?: boolean;
  googleEmail?: string | null;
}

export function AgentStatus({
  modelName = "GLM (via TokenRouter)",
  isOnline = true,
  googleConnected = false,
  googleEmail,
}: AgentStatusProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
      <div className="flex items-center gap-4">
        {/* AI Engine */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">AI Engine:</span>
          <span className="font-mono font-medium text-indigo-300">{modelName}</span>
        </div>

        {/* AI Safety Boundary */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Safety Policy:</span>
          <span className="text-emerald-400 font-medium">Human-in-the-Loop Enforced</span>
        </div>
      </div>

      {/* Google OAuth State */}
      <div className="flex items-center gap-2">
        <Key className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">Google Connection:</span>
        {googleConnected ? (
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <CheckCircle className="w-3 h-3" />
            {googleEmail || "Connected"}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40">
            Not Connected (Required for Deployment)
          </span>
        )}
      </div>
    </div>
  );
}
