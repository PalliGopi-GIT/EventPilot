"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ExternalLink,
  Lock,
  Loader2,
} from "lucide-react";

function ApprovalContent() {
  const searchParams = useSearchParams();
  const googleConnected = searchParams.get("google_connected") === "true";
  const error = searchParams.get("error");

  const [authStatus, setAuthStatus] = useState<{
    connected: boolean;
    email: string | null;
  }>({ connected: false, email: null });

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.googleConnection) {
          setAuthStatus({
            connected: data.googleConnection.connected,
            email: data.googleConnection.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/auth/google");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              Security Hub & OAuth Status
            </h1>
            <p className="text-xs text-slate-400">
              Verify your connected Google account, review encryption guarantees, and authorization policies
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-xs text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-semibold">OAuth Authorization Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {(googleConnected || authStatus.connected) && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold">Google Account Connected Successfully</p>
              <p className="mt-0.5 font-mono text-slate-300">
                Connected email: {authStatus.email || "Active User"}
              </p>
            </div>
          </div>
        )}

        {/* Security Architecture Box */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
          <h3 className="font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Security & Token Encryption Guarantees
          </h3>
          <ul className="space-y-2 text-slate-300 list-disc list-inside">
            <li>
              <strong>AES-256-GCM Encryption:</strong> OAuth access & refresh tokens are encrypted at rest with authenticated tags before storing in PostgreSQL.
            </li>
            <li>
              <strong>Individual Ownership:</strong> Forms and responses are stored strictly per-user and per-account.
            </li>
            <li>
              <strong>No Autonomous External Actions:</strong> No Google Forms are created until you explicitly click "Approve & Deploy".
            </li>
            <li>
              <strong>Cryptographic Idempotency:</strong> Client UUIDs protect against duplicate form generation during network drops or double clicks.
            </li>
          </ul>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
          {!authStatus.connected ? (
            <button
              onClick={handleConnect}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Connect Google Account</span>
            </button>
          ) : (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready to deploy Google Forms</span>
            </div>
          )}

          <Link
            href="/workspace"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            <span>Go to Agent Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <ApprovalContent />
    </Suspense>
  );
}
