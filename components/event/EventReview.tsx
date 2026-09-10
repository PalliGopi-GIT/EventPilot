"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Building,
  Users,
  FileText,
  Check,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import type { EventExtractionResult } from "@/lib/ai/schemas";

interface EventReviewProps {
  initialEvent: EventExtractionResult & { id?: string };
  onSaveAndGenerateForm: (updatedEvent: any, formType: "REGISTRATION" | "FEEDBACK", customInstructions?: string) => void;
  isLoading: boolean;
}

export function EventReview({
  initialEvent,
  onSaveAndGenerateForm,
  isLoading,
}: EventReviewProps) {
  const [name, setName] = useState(initialEvent.name || "");
  const [date, setDate] = useState(initialEvent.date || "");
  const [time, setTime] = useState(initialEvent.time || "");
  const [venue, setVenue] = useState(initialEvent.venue || "");
  const [organizer, setOrganizer] = useState(initialEvent.organizer || "");
  const [description, setDescription] = useState(initialEvent.description || "");
  const [audience, setAudience] = useState(initialEvent.audience || "");
  const [registrationRequired, setRegistrationRequired] = useState(
    initialEvent.registrationRequired || false
  );

  const [selectedFormType, setSelectedFormType] = useState<"REGISTRATION" | "FEEDBACK">("REGISTRATION");
  const [customInstructions, setCustomInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Event name cannot be empty.");
      return;
    }

    onSaveAndGenerateForm(
      {
        id: initialEvent.id,
        name: name.trim(),
        date: date.trim() || null,
        time: time.trim() || null,
        venue: venue.trim() || null,
        organizer: organizer.trim() || null,
        description: description.trim() || null,
        audience: audience.trim() || null,
        registrationRequired,
        confidence: initialEvent.confidence,
      },
      selectedFormType,
      customInstructions.trim() || undefined
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header with Safety Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              2. Human Event Review & Form Choice
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
              Mandatory Safety Checkpoint
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Verify or refine what the AI understood before triggering Google Form generation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Editable Event Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Agents Workshop 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Event Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g. 2026-10-15 or Oct 15, 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Event Time
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 10:00 AM - 1:00 PM"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Venue / Location
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Main Auditorium / Zoom Link"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Organizer */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              Organizer / Host
            </label>
            <input
              type="text"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="e.g. Department of Computer Science"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Undergraduate Students, Developers"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Registration Requirement */}
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="regReq"
              checked={registrationRequired}
              onChange={(e) => setRegistrationRequired(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="regReq" className="text-xs text-slate-300 cursor-pointer font-medium">
              Prior registration explicitly required for attendees
            </label>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Event Description / Agenda
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of topics, speakers, prerequisites..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>
        </div>

        {/* Action Selection: Form Type */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-400" />
              Select Desired Form Type
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              GLM will synthesize an optimized question schema tailored to this form type.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedFormType("REGISTRATION")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedFormType === "REGISTRATION"
                  ? "bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10 text-white"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm text-slate-100">📋 Registration Form</span>
                {selectedFormType === "REGISTRATION" && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <p className="text-xs text-slate-400">
                Collects attendee details, contact, background, college/department, and workshop prerequisites.
              </p>
            </div>

            <div
              onClick={() => setSelectedFormType("FEEDBACK")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedFormType === "FEEDBACK"
                  ? "bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10 text-white"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm text-slate-100">⭐ Feedback / Post-Event Form</span>
                {selectedFormType === "FEEDBACK" && (
                  <Check className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <p className="text-xs text-slate-400">
                Collects rating scales, speaker clarity, content quality, key takeaways, and future topic requests.
              </p>
            </div>
          </div>

          {/* Optional Prompt instructions */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Requirements for GLM Form Generator (Optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Include a question about dietary restrictions and t-shirt size"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submission */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Form Specification with GLM...</span>
              </>
            ) : (
              <>
                <span>Confirm Event Details & Generate Form</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
