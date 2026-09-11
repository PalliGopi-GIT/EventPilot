"use client";

import React from "react";
import { Cpu, ShieldCheck, CheckCircle2, Key } from "lucide-react";

interface AgentStatusProps {
  modelName?: string;
  isOnline?: boolean;
  googleConnected?: boolean;
  googleEmail?: string | null;
}

export function AgentStatus({
  modelName = "GLM-4-Plus",
  isOnline = true,
  googleConnected = false,
  googleEmail,
}: AgentStatusProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300">
      <div className="flex flex-wrap items-center gap-4">
        {/* AI Engine */}
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Engine:</span>
          <span className="font-medium text-white">{modelName}</span>
        </div>

        {/* Safety Boundary */}
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Safety:</span>
          <span className="text-emerald-400 font-medium">Human-in-the-Loop</span>
        </div>
      </div>

      {/* Google OAuth State */}
      <div className="flex items-center gap-2">
        <Key className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">Google:</span>
        {googleConnected ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{googleEmail || "Connected"}</span>
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[11px]">
            Connect to deploy
          </span>
        )}
      </div>
    </div>
  );
}
