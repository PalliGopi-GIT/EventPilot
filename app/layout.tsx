import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "EventPilot — Autonomous Agentic Event Automation Platform",
  description:
    "End-to-end AI Agent that ingests event posters/docs, generates Google Forms with GLM reasoning, and analyzes real participant responses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>EventPilot AI Platform • 36-Hour Hackathon Production Build</span>
            <span>TokenRouter GLM-4 • Google Forms API • Human-in-the-Loop Safe</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
