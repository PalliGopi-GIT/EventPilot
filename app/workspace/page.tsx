"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AgentTrace } from "@/components/agent/AgentTrace";
import { AgentStatus } from "@/components/agent/AgentStatus";
import { SourceUploader } from "@/components/source/SourceUploader";
import { SourceAnalysis } from "@/components/source/SourceAnalysis";
import { EventReview } from "@/components/event/EventReview";
import { FormBuilder } from "@/components/form/FormBuilder";
import { ApprovalPanel } from "@/components/approval/ApprovalPanel";
import { ResponseStats } from "@/components/insights/ResponseStats";
import { Themes } from "@/components/insights/Themes";
import { Recommendations } from "@/components/insights/Recommendations";
import {
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Loader2,
  BarChart3,
  Users,
  ArrowRight,
  AlertCircle,
  Menu,
  X,
  Lock,
  ShieldCheck,
} from "lucide-react";
import type {
  SourceAnalysisResult,
  EventExtractionResult,
  FormDefinition,
  ActionPlan,
  ResponseAnalysisResult,
} from "@/lib/ai/schemas";

type WorkflowStage = "source" | "event" | "form" | "approval" | "success" | "responses" | "insights";

export default function WorkspacePage() {
  const [currentStage, setCurrentStage] = useState<WorkflowStage>("source");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeActionText, setActiveActionText] = useState<string>("Ready to analyze your event");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Error state for inline error display
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  // Workflow State
  const [source, setSource] = useState<any>(null);
  const [sourceAnalysis, setSourceAnalysis] = useState<SourceAnalysisResult | null>(null);
  const [eventData, setEventData] = useState<(EventExtractionResult & { id?: string }) | null>(null);
  const [formData, setFormData] = useState<(FormDefinition & { id: string }) | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [lastNlExplanation, setLastNlExplanation] = useState<string | null>(null);
  const [isModifyingForm, setIsModifyingForm] = useState(false);

  // Google Connection & Deployment State
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; email: string | null }>({
    connected: false,
    email: null,
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    formUrl: string;
    responderUri: string;
    googleFormId: string;
  } | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Response Observation & Insights
  const [isSyncingResponses, setIsSyncingResponses] = useState(false);
  const [storedResponses, setStoredResponses] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ResponseAnalysisResult | null>(null);
  const [isAnalyzingResponses, setIsAnalyzingResponses] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    setIsAuthLoading(true);
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.googleConnection) {
          setGoogleStatus({
            connected: !!data.googleConnection.connected,
            email: data.googleConnection.email,
          });
        }
      })
      .catch((err) => {
        console.error("Auth status error:", err);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // Handler: Source Uploaded -> Automatically trigger Agent 1 Source Analysis
  const handleSourceUploaded = async (uploadedSource: any) => {
    setSource(uploadedSource);
    setIsProcessing(true);
    setWorkflowError(null);
    setActiveActionText("Analyzing source with AI reasoning...");

    try {
      const res = await fetch("/api/sources/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: uploadedSource.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requireGoogleAuth) {
          setGoogleStatus((prev) => ({ ...prev, connected: false }));
          return;
        }
        throw new Error(data.error || "Analysis failed");
      }

      setSourceAnalysis(data.analysis);
      setEventData(data.event);
      setActiveActionText("Analysis complete • Ready for review");
    } catch (err: any) {
      setWorkflowError("Analysis failed: " + err.message);
      setActiveActionText("Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Require Google Auth (from 401 responses)
  const handleRequireGoogleAuth = () => {
    setGoogleStatus((prev) => ({ ...prev, connected: false }));
    setWorkflowError(null);
  };

  // Handler: Human Event Review Confirmed -> Generate Form via GLM
  const handleSaveAndGenerateForm = async (
    updatedEvent: any,
    formType: "REGISTRATION" | "FEEDBACK",
    customInstructions?: string
  ) => {
    setIsProcessing(true);
    setWorkflowError(null);
    setActiveActionText(`Generating ${formType} form...`);

    try {
      if (updatedEvent.id) {
        await fetch(`/api/events/${updatedEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEvent),
        });
      }

      setEventData(updatedEvent);

      const res = await fetch("/api/forms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: updatedEvent.id,
          formType,
          customInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate form");
      }

      setFormData(data.form);
      setActionPlan(data.form.actionPlan);
      setCurrentStage("form");
      setActiveActionText("Form generated • Ready to refine");
    } catch (err: any) {
      setWorkflowError("Form generation error: " + err.message);
      setActiveActionText("Form generation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Conversational Natural Language Form Modification
  const handleModifyForm = async (instruction: string) => {
    if (!formData?.id) return;
    setIsModifyingForm(true);
    setWorkflowError(null);
    setActiveActionText(`Applying: "${instruction.slice(0, 30)}..."`);

    try {
      const res = await fetch("/api/forms/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formData.id,
          userInstruction: instruction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to modify form");
      }

      setFormData(data.form);
      setActionPlan(data.form.actionPlan);
      setLastNlExplanation(data.explanation);
      setActiveActionText("Form updated successfully");
    } catch (err: any) {
      setWorkflowError("Form modification error: " + err.message);
    } finally {
      setIsModifyingForm(false);
    }
  };

  // Handler: Start Google OAuth
  const handleConnectGoogle = async () => {
    try {
      const res = await fetch("/api/auth/google");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to start Google OAuth:", err);
    }
  };

  // Handler: Human Approves and Executes Real Google Form Deployment
  const handleApproveAndDeploy = async (requestId: string) => {
    if (!formData?.id) return;
    setIsDeploying(true);
    setApprovalError(null);
    setActiveActionText("Deploying to Google Forms...");

    try {
      await fetch("/api/forms/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formData.id,
          requestId,
        }),
      });

      const res = await fetch("/api/google/forms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formData.id,
          requestId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to deploy Google Form");
      }

      setDeploymentResult({
        formUrl: data.formUrl,
        responderUri: data.responderUri,
        googleFormId: data.googleFormId,
      });

      setCurrentStage("success");
      setActiveActionText("Form deployed and live");
    } catch (err: any) {
      setApprovalError(err.message || "Failed to deploy to Google Forms");
      setActiveActionText("Deployment error");
    } finally {
      setIsDeploying(false);
    }
  };

  // Handler: Observe & Fetch Real Google Form Responses
  const handleSyncResponses = async () => {
    if (!formData?.id) return;
    setIsSyncingResponses(true);
    setWorkflowError(null);
    setActiveActionText("Fetching live responses...");

    try {
      const res = await fetch("/api/google/forms/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: formData.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync responses");
      }

      setStoredResponses(data.responses);
      setActiveActionText(`${data.totalResponses} responses collected`);

      if (data.totalResponses > 0) {
        handleAnalyzeResponses();
      }
    } catch (err: any) {
      setWorkflowError("Error syncing responses: " + err.message);
    } finally {
      setIsSyncingResponses(false);
    }
  };

  // Handler: Run GLM Response Intelligence Analysis
  const handleAnalyzeResponses = async () => {
    if (!formData?.id) return;
    setIsAnalyzingResponses(true);
    setWorkflowError(null);
    setActiveActionText("Synthesizing response intelligence...");

    try {
      const res = await fetch(`/api/insights/${formData.id}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze responses");
      }

      setAnalysisResult(data.analysis);
      setCurrentStage("insights");
      setActiveActionText("Analysis complete");
    } catch (err: any) {
      setWorkflowError("Error generating insights: " + err.message);
    } finally {
      setIsAnalyzingResponses(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04080f] text-white relative overflow-x-hidden">
      {/* Space-themed Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#04080f]/80 via-[#04080f]/60 to-[#04080f]/90" />
      </div>

      {/* Space-themed Navigation */}
      <header className="relative z-20 border-b border-white/10 bg-[#04080f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-all">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-white tracking-tight">
                event<span className="text-cyan-400">pilot</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/workspace"
                className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg border border-white/20"
              >
                Workspace
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#04080f]/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/workspace"
                className="block px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg border border-white/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Workspace
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* System Status */}
          <AgentStatus googleConnected={googleStatus.connected} googleEmail={googleStatus.email} />

          {/* Workflow Error Banner */}
          {workflowError && (
            <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start gap-3 shadow-lg backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-200">{workflowError}</p>
              </div>
              <button
                onClick={() => setWorkflowError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Agent Trace */}
          <AgentTrace
            currentStage={currentStage}
            isProcessing={isProcessing || isDeploying || isSyncingResponses || isAnalyzingResponses}
            activeAction={activeActionText}
            confidence={sourceAnalysis?.confidence}
          />

          {/* Main Workflow */}
          <div className="space-y-6">
            {/* Auth Loading State */}
            {isAuthLoading && (
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-8 shadow-xl backdrop-blur-sm text-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                <p className="text-sm text-slate-400">Checking authentication status...</p>
              </div>
            )}

            {/* Google Auth Gated Screen */}
            {!isAuthLoading && !googleStatus.connected && (
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-8 shadow-xl backdrop-blur-sm space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Connect your Google account to start uploading event sources
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    EventPilot requires Google authentication to upload and analyze event sources. Please sign in with your Google account to begin the event analysis workflow.
                  </p>
                </div>

                <button
                  onClick={handleConnectGoogle}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 border border-slate-600/50 text-white rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-semibold">Sign in with Google</span>
                </button>
              </div>
            )}

            {/* Step 1: Source Upload & Analysis */}
            {googleStatus.connected && currentStage === "source" && (
              <div className="space-y-6">
                <SourceUploader onSourceUploaded={handleSourceUploaded} isLoading={isProcessing} onRequireGoogleAuth={handleRequireGoogleAuth} />
                {sourceAnalysis && (
                  <SourceAnalysis analysis={sourceAnalysis} onProceedToReview={() => setCurrentStage("event")} />
                )}
              </div>
            )}

            {/* Step 2: Event Review */}
            {currentStage === "event" && eventData && (
              <EventReview
                initialEvent={eventData}
                onSaveAndGenerateForm={handleSaveAndGenerateForm}
                isLoading={isProcessing}
              />
            )}

            {/* Step 3: Form Builder */}
            {currentStage === "form" && formData && (
              <FormBuilder
                form={formData}
                actionPlan={actionPlan}
                onModifyForm={handleModifyForm}
                onProceedToApproval={() => setCurrentStage("approval")}
                isModifying={isModifyingForm}
                lastExplanation={lastNlExplanation}
              />
            )}

            {/* Step 4 & 5: Approval & Deployment */}
            {(currentStage === "approval" || currentStage === "success") && formData && (
              <div className="space-y-6">
                <ApprovalPanel
                  form={formData}
                  actionPlan={
                    actionPlan || {
                      action: "CREATE_GOOGLE_FORM",
                      formType: (formData.formType as any) || "REGISTRATION",
                      title: formData.title,
                      questionCount: formData.questions.length,
                      questionsSummary: formData.questions.map((q) => ({
                        label: q.label,
                        type: q.type,
                        required: q.required,
                      })),
                      provider: "Google Forms",
                      requiresApproval: true,
                    }
                  }
                  googleConnected={googleStatus.connected}
                  googleEmail={googleStatus.email}
                  onConnectGoogle={handleConnectGoogle}
                  onApproveAndCreate={handleApproveAndDeploy}
                  onCancel={() => setCurrentStage("form")}
                  isDeploying={isDeploying}
                  deploymentResult={deploymentResult}
                  error={approvalError}
                />

                {/* Response Collection */}
                {deploymentResult && (
                  <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-6 shadow-xl space-y-4 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/50">
                      <div>
                        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                          <Users className="w-5 h-5 text-slate-400" />
                          Collect Responses
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Share the form link with participants, then sync responses.
                        </p>
                      </div>
                      <button
                        onClick={handleSyncResponses}
                        disabled={isSyncingResponses}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer flex-shrink-0 border border-slate-700/50"
                      >
                        {isSyncingResponses ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span>Sync Responses</span>
                      </button>
                    </div>

                    {storedResponses.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>{storedResponses.length} responses collected</span>
                          <button
                            onClick={handleAnalyzeResponses}
                            disabled={isAnalyzingResponses}
                            className="px-4 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border border-slate-600/50"
                          >
                            {isAnalyzingResponses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                            <span>Analyze Responses</span>
                          </button>
                        </div>

                        <div className="border border-slate-800/50 rounded-lg overflow-x-auto bg-slate-950/60">
                          <table className="w-full text-xs text-left text-slate-300">
                            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
                              <tr>
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Submitted</th>
                                <th className="px-3 py-2">Answers</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {storedResponses.map((r, idx) => (
                                <tr key={r.responseId || idx} className="hover:bg-slate-900/50">
                                  <td className="px-3 py-2 font-mono text-slate-400">{r.responseId?.slice(-8) || idx + 1}</td>
                                  <td className="px-3 py-2 text-slate-200">{r.respondentEmail || "—"}</td>
                                  <td className="px-3 py-2 font-mono text-slate-400">
                                    {new Date(r.submittedAt).toLocaleTimeString()}
                                  </td>
                                  <td className="px-3 py-2 text-slate-300 max-w-xs truncate">{JSON.stringify(r.answers)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950/60 rounded-lg border border-slate-800/50">
                        <p className="text-xs text-slate-400">
                          Share the form link and click <strong>Sync Responses</strong> to collect answers.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Response Intelligence */}
            {(currentStage === "insights" || analysisResult) && analysisResult && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                  <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                    Response Intelligence
                  </h2>
                  <button
                    onClick={handleSyncResponses}
                    disabled={isSyncingResponses}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700/50 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                <ResponseStats analysis={analysisResult} responseCount={storedResponses.length || analysisResult.totalResponses} />
                <Themes
                  themes={analysisResult.themes}
                  topStrengths={analysisResult.topStrengths}
                  commonSuggestions={analysisResult.commonSuggestions}
                />
                <Recommendations recommendations={analysisResult.recommendations} keyTakeaways={analysisResult.keyTakeaways} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
