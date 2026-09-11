"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Calendar,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
  Brain,
  Shield,
  Zap,
  Activity,
  TrendingUp,
} from "lucide-react";
import { CloudShader } from "@/components/ui/cloud-shader";

interface DashboardData {
  success: boolean;
  stats: {
    totalSources: number;
    totalEvents: number;
    totalForms: number;
    totalResponses: number;
    googleConnected: boolean;
    googleEmail: string | null;
  };
  recentEvents: Array<{
    id: string;
    name: string;
    date: string | null;
    venue: string | null;
    organizer: string | null;
    confidence: number;
    createdAt: string;
  }>;
  recentForms: Array<{
    id: string;
    title: string;
    formType: string;
    status: string;
    googleFormId: string | null;
    googleFormUrl: string | null;
    googleResponderUri: string | null;
    responseCount: number;
    hasAnalysis: boolean;
    eventName: string | null;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
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
      <div className="min-h-screen bg-[#04080f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const hasNoActivity = data &&
    data.stats.totalSources === 0 &&
    data.stats.totalEvents === 0 &&
    data.stats.totalForms === 0;

  return (
    <div className="relative min-h-screen bg-[#04080f] overflow-hidden">
      {/* Cloud Shader Background - Subtle atmospheric layer */}
      <div className="fixed inset-0 z-0">
        <CloudShader className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#04080f]/60 to-[#04080f]" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/50 bg-[#04080f]/80 backdrop-blur-xl">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-all">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-lg font-semibold text-white tracking-tight">EventPilot</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/workspace"
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-lg transition-colors"
                  >
                    Workspace
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-3">
                {data?.stats.googleConnected && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-950/30 border border-emerald-800/30 rounded-full text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{data.stats.googleEmail || "Connected"}</span>
                  </div>
                )}
                <Link
                  href="/workspace"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-white/90 text-slate-900 text-sm font-semibold rounded-lg shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Event</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                Turn event information<br className="hidden sm:block" /> into action.
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl">
                Upload event sources, extract intelligence with AI, and deploy Google Forms—all with human oversight.
              </p>
            </div>

            {/* Workflow Visualization */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-full backdrop-blur-sm">
              <Brain className="w-4 h-4 text-cyan-400" />
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <span>UPLOAD</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span>UNDERSTAND</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span>PLAN</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-cyan-400">APPROVE</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span>EXECUTE</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span>OBSERVE</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span>REPORT</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {data && !hasNoActivity && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="group relative p-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl backdrop-blur-sm hover:bg-slate-900/60 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sources</span>
                  </div>
                  <div className="text-3xl font-bold text-white tabular-nums">{data.stats.totalSources}</div>
                  <p className="text-xs text-slate-500">Ingested documents</p>
                </div>
              </div>

              <div className="group relative p-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl backdrop-blur-sm hover:bg-slate-900/60 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Events</span>
                  </div>
                  <div className="text-3xl font-bold text-white tabular-nums">{data.stats.totalEvents}</div>
                  <p className="text-xs text-slate-500">Extracted entities</p>
                </div>
              </div>

              <div className="group relative p-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl backdrop-blur-sm hover:bg-slate-900/60 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Forms</span>
                  </div>
                  <div className="text-3xl font-bold text-white tabular-nums">{data.stats.totalForms}</div>
                  <p className="text-xs text-slate-500">Google Forms created</p>
                </div>
              </div>

              <div className="group relative p-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl backdrop-blur-sm hover:bg-slate-900/60 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Responses</span>
                  </div>
                  <div className="text-3xl font-bold text-white tabular-nums">{data.stats.totalResponses}</div>
                  <p className="text-xs text-slate-500">Total submissions</p>
                </div>
              </div>
            </div>
          )}

          {/* System Status Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-5 bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-sm">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">AI Engine</div>
                <div className="text-xs text-slate-400 truncate">GLM-4-Plus • Active</div>
              </div>
              <div className="flex-shrink-0">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-sm">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">Safety Mode</div>
                <div className="text-xs text-slate-400 truncate">Human-in-the-Loop</div>
              </div>
              <div className="flex-shrink-0 px-2.5 py-1 bg-amber-950/30 border border-amber-800/30 rounded text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                Active
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-sm">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">Google Forms</div>
                <div className="text-xs text-slate-400 truncate">
                  {data?.stats.googleConnected
                    ? `Connected • ${data.stats.googleEmail || "Ready"}`
                    : "Not connected"}
                </div>
              </div>
              <div className="flex-shrink-0">
                {data?.stats.googleConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Link
                    href="/workspace"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Connect
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {hasNoActivity && (
            <div className="mt-12 mb-8">
              <div className="relative p-12 bg-slate-900/40 border border-slate-800/50 rounded-3xl backdrop-blur-sm text-center space-y-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5" />
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Your event workspace is ready
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                    Upload an event poster, PDF, or document to begin. EventPilot will analyze it, extract event details, and help you create registration or feedback forms.
                  </p>
                  <Link
                    href="/workspace"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-slate-900 text-sm font-semibold rounded-lg shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Event Source</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity - Two Column Layout */}
          {data && !hasNoActivity && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent Forms */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    Recent Forms
                  </h2>
                  <span className="text-xs text-slate-500 font-mono">
                    {data.recentForms.length} total
                  </span>
                </div>

                {data.recentForms.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentForms.map((form) => (
                      <div
                        key={form.id}
                        className="group p-5 bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-sm hover:bg-slate-900/60 hover:border-slate-700/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate mb-1">
                              {form.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {form.eventName && (
                                <>
                                  <span className="truncate">{form.eventName}</span>
                                  <span className="text-slate-600">•</span>
                                </>
                              )}
                              <span className="capitalize">{form.formType.toLowerCase()}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                form.status === "CREATED"
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                                  : form.status === "APPROVED"
                                  ? "bg-blue-950/40 text-blue-400 border border-blue-800/40"
                                  : "bg-slate-800/60 text-slate-400 border border-slate-700/40"
                              }`}
                            >
                              {form.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              <span className="font-mono">{form.responseCount}</span>
                              <span>responses</span>
                            </div>
                            {form.hasAnalysis && (
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Analyzed</span>
                              </div>
                            )}
                          </div>
                          {form.googleResponderUri && (
                            <a
                              href={form.googleResponderUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <span>Open Form</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-sm text-center">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      No forms generated yet. Start with an event source.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Events */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    Recent Events
                  </h2>
                  <span className="text-xs text-slate-500 font-mono">
                    {data.recentEvents.length} total
                  </span>
                </div>

                {data.recentEvents.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="group p-5 bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-sm hover:bg-slate-900/60 hover:border-slate-700/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate mb-1">
                              {event.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {event.date && (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>{event.date}</span>
                                </>
                              )}
                              {event.venue && event.date && (
                                <span className="text-slate-600">•</span>
                              )}
                              {event.venue && (
                                <span className="truncate">{event.venue}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="px-2.5 py-1 rounded-full bg-purple-950/40 text-purple-400 border border-purple-800/40 text-[10px] font-semibold uppercase tracking-wider">
                              {Math.round(event.confidence * 100)}% conf
                            </div>
                          </div>
                        </div>

                        {event.organizer && (
                          <div className="pt-3 border-t border-slate-800/50">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Activity className="w-3.5 h-3.5" />
                              <span>Organizer:</span>
                              <span className="text-slate-300">{event.organizer}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-sm text-center">
                    <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      No events extracted yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="mt-8 p-6 bg-gradient-to-r from-slate-900/60 to-slate-900/40 border border-slate-800/50 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Ready to start?</h3>
                <p className="text-xs text-slate-400">
                  Upload an event poster, PDF, or document to begin the workflow.
                </p>
              </div>
              <Link
                href="/workspace"
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-slate-900 text-sm font-semibold rounded-lg shadow-lg transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event Source</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
