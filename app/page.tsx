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
  MessageSquare,
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

export default function AgentWorkspacePage() {
  const [currentStage, setCurrentStage] = useState<WorkflowStage>("source");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeActionText, setActiveActionText] = useState<string>("Waiting for event source");

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
    setActiveActionText("Agent 1: Analyzing Source with GLM...");

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
      setActiveActionText("Source Analyzed • Human Review Ready");
    } catch (err: any) {
      alert("Error in Agent 1 analysis: " + err.message);
      setActiveActionText("Analysis Failed");
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
    setActiveActionText(`GLM: Synthesizing ${formType} Form...`);

    try {
      // 1. Update event in DB if needed
      if (updatedEvent.id) {
        await fetch(`/api/events/${updatedEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEvent),
        });
      }

      setEventData(updatedEvent);

      // 2. Call GLM Form Generator
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
      setActiveActionText("Form Generated • Conversational Refinement Ready");
    } catch (err: any) {
      alert("Form generation error: " + err.message);
      setActiveActionText("Form Generation Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Conversational Natural Language Form Modification
  const handleModifyForm = async (instruction: string) => {
    if (!formData?.id) return;
    setIsModifyingForm(true);
    setActiveActionText(`GLM: Applying instruction: "${instruction.slice(0, 30)}..."`);

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
      setActiveActionText("Form Modified Successfully");
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
    setActiveActionText("Executing Google Forms API...");

    try {
      // 1. Approve form in backend
      await fetch("/api/forms/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formData.id,
          requestId,
        }),
      });

      // 2. Call Google Form Create
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
      setActiveActionText("Real Google Form Live & Ready for Participants");
    } catch (err: any) {
      setApprovalError(err.message || "Failed to deploy to Google Forms");
      setActiveActionText("Deployment Error");
    } finally {
      setIsDeploying(false);
    }
  };

  // Handler: Observe & Fetch Real Google Form Responses
  const handleSyncResponses = async () => {
    if (!formData?.id) return;
    setIsSyncingResponses(true);
    setActiveActionText("Observing: Fetching live Google Form responses...");

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
      setActiveActionText(`Observed ${data.totalResponses} Real Submissions`);

      // Automatically trigger response analysis if there are responses
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
    setActiveActionText("GLM: Synthesizing real response intelligence...");

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
      setActiveActionText("Response Intelligence Generated");
    } catch (err: any) {
      alert("Error generating insights: " + err.message);
    } finally {
      setIsAnalyzingResponses(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Bar */}
      <AgentStatus
        googleConnected={googleStatus.connected}
        googleEmail={googleStatus.email}
      />

      {/* Agent Trace Loop Header */}
      <AgentTrace
        currentStage={currentStage}
        isProcessing={isProcessing || isDeploying || isSyncingResponses || isAnalyzingResponses}
        activeAction={activeActionText}
        confidence={sourceAnalysis?.confidence}
      />

      {/* Main Workflow Viewports */}
      <div className="space-y-6">
        {/* Step 1: Ingest Source & Agent 1 Output */}
        {currentStage === "source" && (
          <div className="space-y-6">
            <SourceUploader
              onSourceUploaded={handleSourceUploaded}
              isLoading={isProcessing}
            />

            {sourceAnalysis && (
              <SourceAnalysis
                analysis={sourceAnalysis}
                onProceedToReview={() => setCurrentStage("event")}
              />
            )}
          </div>
        )}

        {/* Step 2: Human Event Review Checkpoint */}
        {currentStage === "event" && eventData && (
          <EventReview
            initialEvent={eventData}
            onSaveAndGenerateForm={handleSaveAndGenerateForm}
            isLoading={isProcessing}
          />
        )}

        {/* Step 3: Form Specification & Natural Language Editor */}
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

        {/* Step 4 & 5: Human Approval & Google Form Deployment */}
        {(currentStage === "approval" || currentStage === "success") && formData && (
          <div className="space-y-6">
            <ApprovalPanel
              form={formData}
              actionPlan={actionPlan || {
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
              }}
              googleConnected={googleStatus.connected}
              googleEmail={googleStatus.email}
              onConnectGoogle={handleConnectGoogle}
              onApproveAndCreate={handleApproveAndDeploy}
              onCancel={() => setCurrentStage("form")}
              isDeploying={isDeploying}
              deploymentResult={deploymentResult}
              error={approvalError}
            />

            {/* Live Observation & Response Collection Panel (Once deployed) */}
            {deploymentResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      5. Live Participant Submissions (Google Forms API)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Share the link with participants, then fetch real responses for GLM analysis.
                    </p>
                  </div>

                  <button
                    onClick={handleSyncResponses}
                    disabled={isSyncingResponses}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer flex-shrink-0"
                  >
                    {isSyncingResponses ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Sync Live Responses</span>
                  </button>
                </div>

                {storedResponses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{storedResponses.length} Real Responses Synced</span>
                      <button
                        onClick={handleAnalyzeResponses}
                        disabled={isAnalyzingResponses}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {isAnalyzingResponses ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Run GLM Response Analysis</span>
                      </button>
                    </div>

                    {/* Table of submissions */}
                    <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                          <tr>
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">Respondent Email</th>
                            <th className="px-3 py-2">Submitted Time</th>
                            <th className="px-3 py-2">Answers Summary</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {storedResponses.map((r, idx) => (
                            <tr key={r.responseId || idx} className="hover:bg-slate-900/50">
                              <td className="px-3 py-2 font-mono text-slate-400">
                                {r.responseId?.slice(-8) || idx + 1}
                              </td>
                              <td className="px-3 py-2 text-slate-200">
                                {r.respondentEmail || "Anonymous Participant"}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-400">
                                {new Date(r.submittedAt).toLocaleTimeString()}
                              </td>
                              <td className="px-3 py-2 text-slate-300 max-w-xs truncate">
                                {JSON.stringify(r.answers)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <p className="text-xs text-slate-400">
                      No responses received yet. Send the Google Form link to participants and click{" "}
                      <strong>Sync Live Responses</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 6: GLM Response Intelligence Dashboard */}
        {(currentStage === "insights" || analysisResult) && analysisResult && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                6. GLM Event Intelligence & Response Analysis
              </h2>
              <button
                onClick={handleSyncResponses}
                disabled={isSyncingResponses}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Metrics */}
            <ResponseStats
              analysis={analysisResult}
              responseCount={storedResponses.length || analysisResult.totalResponses}
            />

            {/* Strengths & Themes */}
            <Themes
              themes={analysisResult.themes}
              topStrengths={analysisResult.topStrengths}
              commonSuggestions={analysisResult.commonSuggestions}
            />

            {/* Recommendations */}
            <Recommendations
              recommendations={analysisResult.recommendations}
              keyTakeaways={analysisResult.keyTakeaways}
            />
          </div>
        )}
      </div>
    </div>
  );
}
