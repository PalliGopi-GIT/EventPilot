"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  Calendar,
  Users,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  Layers,
  BarChart3,
  Clock,
} from "lucide-react";
import { CloudShader } from "@/components/dashboard/CloudShader";
import { formatDate } from "@/lib/utils/helpers";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch((err) => console.error("Error loading dashboard:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Atmospheric Cloud Shader Header */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-8 h-32 sm:h-40 overflow-hidden rounded-b-3xl border-b border-slate-800/60">
        <CloudShader className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070b14]/60 to-[#070b14]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              Organizer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Real-time overview of extracted events, deployed forms, and live participant intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Event Workflow</span>
        </Link>
      </div>

      {/* Stats KPI Row */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Ingested Sources</span>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {data.stats.totalSources}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Extracted Events</span>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {data.stats.totalEvents}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Google Forms Created</span>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {data.stats.totalForms}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Total Responses</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {data.stats.totalResponses}
            </div>
          </div>
        </div>
      )}

      {/* Forms & Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Forms */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Generated Google Forms
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {data?.recentForms?.length || 0} Total
            </span>
          </div>

          {data?.recentForms && data.recentForms.length > 0 ? (
            <div className="space-y-3">
              {data.recentForms.map((f: any) => (
                <div
                  key={f.id}
                  className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-200">{f.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {f.eventName ? `Event: ${f.eventName}` : "Draft Form"} • {f.formType}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        f.status === "CREATED"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {f.responseCount} Submissions
                    </span>

                    <div className="flex items-center gap-2">
                      {f.googleResponderUri && (
                        <a
                          href={f.googleResponderUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                        >
                          <span>Open Form</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center">
              No forms generated yet. Start with a source poster on the workspace page.
            </p>
          )}
        </div>

        {/* Recent Ingested Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Ingested Event Sources
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {data?.recentEvents?.length || 0} Total
            </span>
          </div>

          {data?.recentEvents && data.recentEvents.length > 0 ? (
            <div className="space-y-3">
              {data.recentEvents.map((ev: any) => (
                <div
                  key={ev.id}
                  className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-200">{ev.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ev.date || "Date TBD"} • {ev.venue || "Venue TBD"}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                      Confidence: {(ev.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {ev.organizer && (
                    <p className="text-[11px] text-slate-400">
                      Organizer: <span className="text-slate-300">{ev.organizer}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center">
              No events ingested yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
