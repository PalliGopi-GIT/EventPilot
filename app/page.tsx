"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";

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

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const { displayed, done } = useTypewriter(
    "Glad you stopped in. Good taste tends to find us. Now, what are we building?",
    38,
    600
  );

  // Show pills 400ms after mount
  useEffect(() => {
    const timer = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(timer);
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
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[21px] sm:text-[26px] tracking-tight text-black"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              EventPilot®
            </Link>
            <span
              className="text-[25px] sm:text-[30px] text-black select-none"
              style={{ letterSpacing: "-0.02em" }}
            >
              ✳︎
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 text-[23px] text-black">
            <Link href="/workspace" className="hover:opacity-60 transition-opacity">Workspace</Link>
            <span>,</span>
            <Link href="/dashboard" className="hover:opacity-60 transition-opacity ml-1">Dashboard</Link>
            <span>,</span>
            <Link href="/approval" className="hover:opacity-60 transition-opacity ml-1">Security</Link>
          </div>

          {/* Desktop CTA */}
          <Link
            href="/workspace"
            className="hidden md:block text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity"
          >
            Start building
          </Link>

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
        className={`md:hidden fixed inset-0 z-[9] bg-white/95 backdrop-blur-sm flex flex-col justify-center px-8 gap-8 transition-opacity duration-300 ${
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
          href="/workspace"
          className="text-[32px] font-medium text-black underline underline-offset-2"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Start building
        </Link>
      </div>

      {/* Hero Section */}
      <main className="h-screen flex flex-col justify-end md:justify-center pb-12 md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden relative z-[1]">
        <div className="max-w-xl relative z-10">
          {/* Blurred Intro Label */}
          <div
            className="pointer-events-none select-none mb-5 sm:mb-6"
            style={{
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: "1.3",
              fontWeight: 400,
              color: "#000",
              filter: "blur(4px)",
            }}
          >
            Hey there, meet EventPilot,
            <br />
            Your Adaptive Event Intelligence Agent
          </div>

          {/* Typewriter Text */}
          <p
            className="text-black mb-5 sm:mb-6 min-h-[54px]"
            style={{
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: "1.35",
              fontWeight: 400,
            }}
          >
            {displayed}
            {!done && (
              <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] animate-blink" />
            )}
          </p>

          {/* Action Pills */}
          <div
            className={`flex flex-wrap gap-y-1 transition-all duration-[400ms] ease-out ${
              pillsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] hover:bg-black hover:text-white transition-colors duration-200 whitespace-nowrap"
              style={{ fontSize: "clamp(13px, 3vw, 15px)" }}
            >
              Upload event source
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] hover:bg-black hover:text-white transition-colors duration-200 whitespace-nowrap"
              style={{ fontSize: "clamp(13px, 3vw, 15px)" }}
            >
              View dashboard
            </Link>
            <Link
              href="/approval"
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] hover:bg-black hover:text-white transition-colors duration-200 whitespace-nowrap"
              style={{ fontSize: "clamp(13px, 3vw, 15px)" }}
            >
              Security settings
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] hover:bg-black hover:text-white transition-colors duration-200 whitespace-nowrap"
              style={{ fontSize: "clamp(13px, 3vw, 15px)" }}
            >
              See how it works
            </Link>
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-2 sm:gap-3 text-white bg-transparent border border-white rounded-full px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] hover:bg-white hover:text-black transition-colors duration-200 whitespace-nowrap"
              style={{ fontSize: "clamp(13px, 3vw, 15px)" }}
            >
              <span>
                Reach us: <span className="underline underline-offset-1">hello@eventpilot.ai</span>
              </span>
              {copied ? (
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
