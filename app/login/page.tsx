"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch("/api/auth/google");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  // Removed fake email/password login - use Google OAuth only
  // The form below is for demo purposes and does not perform authentication

  return (
    <div className="fixed inset-0 z-50 bg-[#06080d] text-white overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
      {/* Left Media Panel */}
      <div className="relative w-full lg:w-[57%] h-[280px] sm:h-[360px] lg:h-full overflow-hidden bg-black flex-shrink-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center scale-105"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_052122_e77a27e6-17f1-4794-889b-3ceaa0e9e8cb.mp4"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-black/30 to-black/60 lg:bg-gradient-to-r lg:from-transparent lg:via-black/20 lg:to-[#06080d]" />

        {/* Brand */}
        <div className="absolute top-6 left-6 z-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white border border-slate-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg text-white">
              EventPilot
            </span>
          </Link>
        </div>

        {/* Headline */}
        <div className="absolute bottom-8 left-6 right-6 lg:bottom-12 lg:left-12 z-10 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-xs font-medium text-white">
            <Zap className="w-3.5 h-3.5 text-slate-300" />
            <span>Built for event teams</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-none">
            Find signal to action. Instantly.
          </h2>

          <p className="hidden sm:block text-sm text-slate-300 leading-relaxed max-w-md">
            Deploy Google Forms from event posters, observe participant responses, and synthesize intelligence automatically.
          </p>
        </div>
      </div>

      {/* Right Login Pane */}
      <div className="flex-1 min-h-full flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#f8f9fa]">
        <div className="w-full max-w-[460px] space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Welcome to EventPilot
            </h1>
            <p className="text-sm text-gray-600">
              Sign in with Google to access your event forms and analytics.
            </p>
          </div>

          {/* Demo Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            <strong>Demo:</strong> This app uses Google OAuth for authentication. Click "Sign in with Google" below to authorize access to Google Forms.
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleConnectGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-xl transition-all cursor-pointer border border-slate-200"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Security Note */}
          <div className="p-3.5 bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-2.5 text-xs text-gray-600">
            <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>AES-256-GCM encrypted OAuth tokens with human authorization.</span>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 pt-2">
            Don't have an account?{" "}
            <Link href="/" className="font-semibold text-gray-900 underline underline-offset-4">
              Start analyzing
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
