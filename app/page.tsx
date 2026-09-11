"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Copy, Check, ArrowRight } from "lucide-react";

function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    let currentIndex = 0;
    let timer: NodeJS.Timeout;

    const delayTimeout = setTimeout(() => {
      timer = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayed(text.slice(0, currentIndex));
        } else {
          setDone(true);
          clearInterval(timer);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(delayTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

const HEADLINE = "Understand the Need. Find the Right Help. Make an Impact";

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Staged reveal: supporting copy and actions follow the headline
  const [showDescription, setShowDescription] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const { displayed, done } = useTypewriter(HEADLINE, 30, 600);

  useEffect(() => {
    if (!done) return;
    setShowDescription(true);
    const t = setTimeout(() => setShowActions(true), 300);
    return () => clearTimeout(t);
  }, [done]);

  // Safety fallback: never leave actions hidden
  useEffect(() => {
    const fallback = setTimeout(() => {
      setShowDescription(true);
      setShowActions(true);
    }, 5000);
    return () => clearTimeout(fallback);
  }, []);

  // Mouse-scrub video control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let prevX = 0;
    let isSeeking = false;
    let targetTime = 0;
    const SENSITIVITY = 0.8;

    const handleMouseMove = (e: MouseEvent) => {
      if (!video.duration) return;

      const currentX = e.clientX;
      if (prevX === 0) {
        prevX = currentX;
        return;
      }

      const delta = currentX - prevX;
      prevX = currentX;

      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
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

    window.addEventListener("mousemove", handleMouseMove);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("hello@eventpilot.ai");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Split the typed headline into its three sentences, one per line.
  // New lines appear as they are typed.
  const headlineLines = displayed.split(". ");

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{ objectPosition: "70% center" }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4"
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-10 px-5 sm:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="text-[21px] sm:text-[24px] tracking-tight text-black"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              EventPilot®
            </Link>
            <span
              className="text-[25px] sm:text-[28px] text-black select-none"
              style={{ letterSpacing: "-0.02em" }}
            >
              ✳︎
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-[15px] text-black/70">
            <Link href="/workspace" className="hover:text-black transition-colors">Workspace</Link>
            <Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
            <Link href="/approval" className="hover:text-black transition-colors">Security</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/login"
              className="text-[15px] text-black/70 hover:text-black transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/workspace"
              className="bg-black text-white text-sm font-medium rounded-full px-5 py-2.5 hover:bg-slate-800 transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Start building
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex flex-col gap-[5px]"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-[2px] bg-black transition-all duration-300 ${
                isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`w-6 h-[2px] bg-black transition-opacity duration-300 ${
                isMobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`w-6 h-[2px] bg-black transition-all duration-300 ${
                isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[9] bg-white/95 backdrop-blur-sm flex flex-col justify-center px-8 gap-7 transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <Link
          href="/workspace"
          className="text-[32px] font-medium text-black"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Workspace
        </Link>
        <Link
          href="/dashboard"
          className="text-[32px] font-medium text-black"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Dashboard
        </Link>
        <Link
          href="/approval"
          className="text-[32px] font-medium text-black"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Security
        </Link>
        <Link
          href="/login"
          className="text-[24px] font-medium text-black/60"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Log in
        </Link>
        <Link
          href="/workspace"
          className="text-[32px] font-medium text-black underline underline-offset-4"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Start building
        </Link>
      </div>

      {/* Hero Section */}
      <main className="h-screen flex flex-col justify-center px-5 sm:px-8 md:px-16 lg:px-24 overflow-hidden relative z-[1]">
        <div className="max-w-[640px] relative z-10">
          {/* Blurred Intro Label */}
          <div
            className="pointer-events-none select-none mb-6 sm:mb-8"
            style={{
              fontSize: "clamp(15px, 3vw, 19px)",
              lineHeight: 1.4,
              fontWeight: 400,
              color: "#000",
              filter: "blur(4px)",
              opacity: 0.85,
            }}
          >
            Hey there, meet EventPilot,
            <br />
            Your Adaptive Event Intelligence Agent
          </div>

          {/* Typewriter Headline */}
          <h1
            className="text-black tracking-tight mb-6 sm:mb-8 min-h-[3.45em]"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(30px, 6.5vw, 56px)",
              lineHeight: 1.12,
              fontWeight: 400,
            }}
          >
            {headlineLines.map((line, i) => (
              <span key={i} className="block">
                {line}
                {i === headlineLines.length - 1 && !done && (
                  <span className="inline-block w-[3px] h-[0.95em] bg-black align-middle ml-[3px] animate-blink" />
                )}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p
            className={`text-black/70 max-w-lg mb-8 sm:mb-10 transition-all duration-500 ease-out ${
              showDescription ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{
              fontSize: "clamp(14px, 2.5vw, 17px)",
              lineHeight: 1.6,
            }}
          >
            EventPilot reads your event posters and announcements, drafts the right
            registration or feedback form, and asks for your approval before
            anything goes live on Google Forms — then turns participant
            responses into insight.
          </p>

          {/* Primary + Secondary Actions */}
          <div
            className={`flex flex-wrap items-center gap-3 sm:gap-4 transition-all duration-500 ease-out ${
              showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center gap-2 bg-black text-white rounded-full px-6 py-3 sm:py-3.5 hover:bg-slate-800 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)] transition-colors duration-200 whitespace-nowrap"
              style={{ fontSize: "clamp(14px, 2.5vw, 16px)", fontFamily: "var(--font-heading)" }}
            >
              Upload event source
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-white/90 text-black border border-black/15 rounded-full px-5 py-3 sm:py-3.5 hover:bg-white transition-colors duration-200 whitespace-nowrap"
              style={{ fontSize: "clamp(14px, 2.5vw, 16px)" }}
            >
              View dashboard
            </Link>
          </div>

          {/* Secondary Group */}
          <div
            className={`flex flex-wrap items-center gap-2 mt-3 transition-all duration-500 ease-out delay-150 ${
              showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            <Link
              href="/approval"
              className="inline-flex items-center justify-center bg-white/70 text-black/80 border border-black/10 rounded-full px-4 py-2 hover:bg-white hover:text-black transition-colors duration-200 text-[13px] whitespace-nowrap"
            >
              Security settings
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center bg-white/70 text-black/80 border border-black/10 rounded-full px-4 py-2 hover:bg-white hover:text-black transition-colors duration-200 text-[13px] whitespace-nowrap"
            >
              See how it works
            </Link>
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-2 bg-white/70 text-black/80 border border-black/10 rounded-full px-4 py-2 hover:bg-white hover:text-black transition-colors duration-200 text-[13px] whitespace-nowrap"
            >
              <span>
                Reach us: <span className="underline underline-offset-2">hello@eventpilot.ai</span>
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Product Flow */}
          <div
            className={`mt-10 sm:mt-12 font-mono text-black/50 tracking-wide transition-all duration-500 ease-out delay-300 ${
              showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ fontSize: "clamp(10px, 1.8vw, 12px)" }}
          >
            Analyze source <span className="mx-1">→</span> Draft form <span className="mx-1">→</span>{" "}
            Your approval <span className="mx-1">→</span> Google Forms <span className="mx-1">→</span>{" "}
            Insights
          </div>
        </div>
      </main>
    </div>
  );
}
