"use client";

import React, { useState, useRef } from "react";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";

interface SendFormEmailProps {
  formId: string;
  responderUri: string;
  formTitle: string;
}

export function SendFormEmail({ formId, responderUri, formTitle }: SendFormEmailProps) {
  const [recipients, setRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentRecipientCount, setSentRecipientCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSuccess(false);
    setError(null);

    const recipientArray = recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email): email is string => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (recipientArray.length === 0) {
      setError("Please enter at least one valid email address");
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch("/api/forms/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId, recipients: recipientArray }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSentRecipientCount(recipientArray.length);
      setSuccess(true);
      setRecipients("");
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-emerald-300">Email Sent!</h3>
        <p className="text-xs text-slate-300 mt-1">
          Form link sent to {sentRecipientCount} recipient(s)
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-all"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <ExternalLink className="w-5 h-5 text-slate-400" />
        Send Form via Email
      </h3>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-3 flex items-center gap-2 text-xs text-red-300 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-300 block mb-2">
            Who should receive this form?
          </label>
          <input
            ref={inputRef}
            type="email"
            placeholder="recipient@email.com"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            required
            aria-label="Recipient email"
          />
          <p className="text-xs text-slate-400 mt-1">
            Separate multiple emails with commas
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Form: <strong className="text-slate-200">{formTitle}</strong>
          </p>
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              <span>Send Email</span>
            </>
          )}
        </button>
      </form>

      {success && !error && (
        <div className="mt-4 text-sm text-emerald-400">
          The form link has been sent successfully!
        </div>
      )}
    </div>
  );
}