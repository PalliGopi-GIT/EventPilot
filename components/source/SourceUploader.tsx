"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, FileCode, AlertCircle, Loader2, ArrowRight } from "lucide-react";

interface SourceUploaderProps {
  onSourceUploaded: (sourceData: any) => void;
  isLoading: boolean;
}

export function SourceUploader({ onSourceUploaded, isLoading }: SourceUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15MB limit.");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === "file" && !selectedFile) {
      setError("Please select a file or switch to paste text mode.");
      return;
    }

    if (activeTab === "text" && !rawText.trim()) {
      setError("Please enter event announcement text.");
      return;
    }

    try {
      const formData = new FormData();
      if (activeTab === "file" && selectedFile) {
        formData.append("file", selectedFile);
      }
      if (rawText.trim()) {
        formData.append("text", rawText.trim());
      }

      const res = await fetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onSourceUploaded(data.source);
    } catch (err: any) {
      setError(err.message || "Failed to process source");
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Upload Event Source
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Poster, PDF, presentation, or paste announcement text
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "file"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "text"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "file" ? (
          <div>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-slate-600 bg-slate-800/50"
                  : selectedFile
                  ? "border-slate-600 bg-slate-800/30"
                  : "border-slate-700 hover:border-slate-600 bg-slate-950/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.ppt,.pptx,text/plain,.md"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-4">
                  {previewUrl ? (
                    <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-slate-700">
                      <img
                        src={previewUrl}
                        alt="Event Poster Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-800 rounded-full text-slate-300">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-200">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300 underline"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-slate-800/80 rounded-full text-slate-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Drop event poster, PDF, or presentation
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      PNG, JPG, PDF, PPTX, TXT up to 15MB
                    </p>
                  </div>
                  <span className="text-xs px-4 py-2 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
                    Browse Files
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-3">
              Event Announcement
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste email invitation, WhatsApp notice, meetup description, or conference schedule...&#10;&#10;Example:&#10;AI Agents Workshop 2026&#10;Date: October 15, 2026 | 10:00 AM&#10;Venue: Main Auditorium, CS Department&#10;Organized by: IEEE CS Chapter"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 focus:outline-none focus:border-slate-600 font-sans resize-y"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || (activeTab === "file" && !selectedFile) || (activeTab === "text" && !rawText.trim())}
            className="flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold rounded-lg shadow-md transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Event</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
