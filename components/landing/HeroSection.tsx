"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  ShieldCheck,
  Bot,
  Layers,
  FileSpreadsheet,
  BarChart3,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useTypewriter } from "@/lib/utils/useTypewriter";

interface HeroSectionProps {
  onStartWorkflow?: (preselectedCategory?: string) => void;
}

export function HeroSection({ onStartWorkflow }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["AI Hackathon", "Developer Summit"]);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Typewriter text
  const { displayed, done } = useTypewriter(
    "Turn raw event posters into deployed Google Forms and real participant intelligence — autonomously.",
    28,
    400
  );

  // Background Video mouse-scrub logic (Desktop) & Autoplay (Mobile)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let prevX = 0;
    let isSeeking = false;
    let targetTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024 || !video.duration) return;

      const currentX = e.clientX;
      if (prevX === 0) {
        prevX = currentX;
        return;
      }

      const delta = currentX - prevX;
      prevX = currentX;

      const sensitivity = 0.8;
      const timeOffset = (delta / window.innerWidth) * sensitivity * video.duration;
      targetTime = Math.max(0, Math.min(video.duration, (video.currentTime || 0) + timeOffset));

      if (!isSeeking) {
        isSeeking = true;
        video.currentTime = targetTime;
      }
    };

    const handleSeeked = () => {
      isSeeking = false;
      if (video && Math.abs(video.currentTime - targetTime) > 0.1) {
        video.currentTime = targetTime;
      }
    };

    if (window.innerWidth < 1024) {
      video.autoplay = true;
      video.loop = true;
      video.play().catch(() => {});
    } else {
      window.addEventListener("mousemove", handleMouseMove);
      video.addEventListener("seeked", handleSeeked);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (video) video.removeEventListener("seeked", handleSeeked);
    };
  }, []);

  const eventTypes = [
    "AI Hackathon",
    "Developer Summit",
    "Tech Conference",
    "Hands-on Workshop",
    "Community Meetup",
    "Executive Roundtable",
  ];

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCopyContact = () => {
    navigator.clipboard.writeText("hello@eventpilot.ai");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <section className="relative w-full overflow-hidden min-h-[92vh] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-[#070a12] via-[#06080e] to-[#04060a]">
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-25 mix-blend-screen">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4"
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center scale-105 filter contrast-125 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-[#06080d]/80" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center py-8">
        {/* Top Product Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-md shadow-lg shadow-black/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">EventPilot Agent System</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">TokenRouter GLM-4 + Google Forms API</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6 select-none max-w-4xl">
            Autonomous event intelligence. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              From poster to deployed form.
            </span>
          </h1>
        </motion.div>

        {/* Typewriter Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="min-h-[64px] sm:min-h-[56px] mb-8"
        >
          <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed font-normal max-w-3xl">
            {displayed}
            {!done && (
              <span className="inline-block w-[2px] h-[1.1em] bg-blue-400 align-middle ml-1 animate-blink" />
            )}
          </p>
        </motion.div>

        {/* Interactive Event Type Selector Pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="space-y-3 mb-8"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select event blueprint to configure:
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {selectedTypes.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => {
              const active = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30 scale-[1.02]"
                      : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-blue-200" />}
                  <span>{type}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Acknowledgment Banner */}
          <AnimatePresence mode="wait">
            {selectedTypes.length > 0 ? (
              <motion.div
                key="banner-active"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>
                      Ready to synthesize registration & feedback schema for:{" "}
                      <strong className="text-white">{selectedTypes.join(", ")}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => onStartWorkflow?.(selectedTypes[0])}
                    className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap self-end sm:self-auto"
                  >
                    <span>Launch Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="banner-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-xs text-slate-500 italic"
              >
                Click above to select an event format or drop your own file below.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Primary Action Pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-wrap items-center gap-3 pt-2"
        >
          <button
            onClick={() => onStartWorkflow?.()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Agent Automation Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyContact}
            className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium rounded-xl border border-slate-800 transition-all cursor-pointer"
          >
            {copiedEmail ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied hello@eventpilot.ai</span>
              </>
            ) : (
              <>
                <span>Contact: hello@eventpilot.ai</span>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Trust & Architecture KPI Ribbon */}
      <div className="relative z-10 max-w-5xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 border-t border-slate-800/80">
        <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl backdrop-blur-sm">
          <Bot className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-slate-200">Perceive & Understand</div>
            <div className="text-[11px] text-slate-400">Multimodal poster parsing</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl backdrop-blur-sm">
          <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-slate-200">Human Checkpoint</div>
            <div className="text-[11px] text-slate-400">Mandatory approval gate</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl backdrop-blur-sm">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-slate-200">Google Forms API</div>
            <div className="text-[11px] text-slate-400">Deterministic live deploy</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl backdrop-blur-sm">
          <BarChart3 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-slate-200">Response Analytics</div>
            <div className="text-[11px] text-slate-400">Synthesized themes & stats</div>
          </div>
        </div>
      </div>
    </section>
  );
}
