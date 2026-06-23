"use client";
import { useState } from "react";
import { AppContext, type AppState } from "@/lib/store";
import type { AnalysisResult } from "@/types";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [result,    setResult]    = useState<AnalysisResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [geminiKey, setGeminiKey] = useState("");

  const ctx: AppState = {
    result, loading, geminiKey,
    setResult, setLoading, setGeminiKey,
    reset: () => { setResult(null); setLoading(false); },
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}
