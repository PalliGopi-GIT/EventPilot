"use client";

import React, { useState, useEffect } from "react";
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

  // Workflow State
  const [source, setSource] = useState<any>(null);
  const [sourceAnalysis, setSourceAnalysis] = useState<SourceAnalysisResult | null>(null);
  const [eventData, setEventData] = useState<(EventExtractionResult & { id?: string }) | null>(null);
  const [formData, setFormData] = useState<(FormDefinition & { id: string }) | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [lastNlExplanation, setLastNlExplanation] = useState<string | null>(null);
  const [isModifyingForm, setIsModifyingForm] = useState(false);

  // Google Connection & Deployment State
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
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.googleConnection) {
          setGoogleStatus({
            connected: data.googleConnection.connected,
            email: data.googleConnection.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Handler: Source Uploaded -> Automatically trigger Agent 1 Source Analysis
  const handleSourceUploaded = async (uploadedSource: any) => {
    setSource(uploadedSource);
    setIsProcessing(true);
    setActiveActionText("Analyzing source with AI reasoning...");

    try {
      const res = await fetch("/api/sources/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: uploadedSource.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setSourceAnalysis(data.analysis);
      setEventData(data.event);
      setActiveActionText("Analysis complete • Ready for review");
    } catch (err: any) {
      alert("Error in analysis: " + err.message);
      setActiveActionText("Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Human Event Review Confirmed -> Generate Form via GLM
  const handleSaveAndGenerateForm = async (
    updatedEvent: any,
    formType: "REGISTRATION" | "FEEDBACK",
    customInstructions?: string
  ) => {
    setIsProcessing(true);
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
      alert("Form generation error: " + err.message);
      setActiveActionText("Form generation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Conversational Natural Language Form Modification
  const handleModifyForm = async (instruction: string) => {
    if (!formData?.id) return;
    setIsModifyingForm(true);
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
      alert("Form modification error: " + err.message);
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
      alert("Error syncing responses: " + err.message);
    } finally {
      setIsSyncingResponses(false);
    }
  };

  // Handler: Run GLM Response Intelligence Analysis
  const handleAnalyzeResponses = async () => {
    if (!formData?.id) return;
    setIsAnalyzingResponses(true);
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
      alert("Error generating insights: " + err.message);
    } finally {
      setIsAnalyzingResponses(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      {/* Header with Back Link */}
      <div className="border-b border-slate-800/80 bg-[#06080d]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to home
          </a>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>Agent Workspace</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* System Status */}
        <AgentStatus googleConnected={googleStatus.connected} googleEmail={googleStatus.email} />

        {/* Agent Trace */}
        <AgentTrace
          currentStage={currentStage}
          isProcessing={isProcessing || isDeploying || isSyncingResponses || isAnalyzingResponses}
          activeAction={activeActionText}
          confidence={sourceAnalysis?.confidence}
        />

        {/* Main Workflow */}
        <div className="space-y-6">
          {/* Step 1: Source Upload & Analysis */}
          {currentStage === "source" && (
            <div className="space-y-6">
              <SourceUploader onSourceUploaded={handleSourceUploaded} isLoading={isProcessing} />
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
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
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer flex-shrink-0"
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
                          className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {isAnalyzingResponses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                          <span>Analyze Responses</span>
                        </button>
                      </div>

                      <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950">
                        <table className="w-full text-xs text-left text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                            <tr>
                              <th className="px-3 py-2">ID</th>
                              <th className="px-3 py-2">Email</th>
                              <th className="px-3 py-2">Submitted</th>
                              <th className="px-3 py-2">Answers</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
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
                    <div className="p-8 text-center bg-slate-950/60 rounded-lg border border-slate-800/80">
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
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                  Response Intelligence
                </h2>
                <button
                  onClick={handleSyncResponses}
                  disabled={isSyncingResponses}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700 transition-all cursor-pointer"
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
  );
}
