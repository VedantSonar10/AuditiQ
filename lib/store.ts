"use client";
import { createContext, useContext } from "react";
import type { AnalysisResult } from "@/types";

export interface AppState {
  result:       AnalysisResult | null;
  loading:      boolean;
  geminiKey:    string;
  setResult:    (r: AnalysisResult | null) => void;
  setLoading:   (l: boolean) => void;
  setGeminiKey: (k: string) => void;
  reset:        () => void;
}

export const AppContext = createContext<AppState>({
  result: null, loading: false, geminiKey: "",
  setResult: () => {}, setLoading: () => {}, setGeminiKey: () => {}, reset: () => {},
});

export const useApp = () => useContext(AppContext);
