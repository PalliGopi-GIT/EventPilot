"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  KeyRound,
  CheckCircle2,
  LogIn,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    connected: boolean;
    email: string | null;
  }>({ connected: false, email: null });

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.googleConnection) {
          setAuthStatus({
            connected: data.googleConnection.connected,
            email: data.googleConnection.email,
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

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

  const navLinks = [
    { href: "/", label: "Workspace", icon: Sparkles },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/approval", label: "Security", icon: ShieldCheck },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#06080d]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white border border-slate-700 group-hover:border-slate-600 transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base text-slate-100 tracking-tight">
              EventPilot
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {authStatus.connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium truncate max-w-[130px] sm:max-w-[200px]">
                {authStatus.email}
              </span>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Connect Google</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-200 hover:bg-white text-slate-900 text-xs font-semibold rounded-lg transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log In</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#06080d] px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
