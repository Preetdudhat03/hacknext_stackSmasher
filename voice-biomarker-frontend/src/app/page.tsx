"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import AudioCapture from "@/components/AudioCapture";
import Analyzing from "@/components/Analyzing";
import BodyInsights from "@/components/BodyInsights";
import { AnimatePresence, motion } from "framer-motion";

export type Stage = "hero" | "capture" | "analyzing" | "results";
export type AnalysisResult = any; // Will be properly typed down the line

export default function Home() {
  const [stage, setStage] = useState<Stage>("hero");
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const handleCaptureComplete = async (audioBlob: Blob) => {
    setStage("analyzing");
    
    // Convert blob to File and send to the backend
    try {
      const formData = new FormData();
      formData.append("audio_file", audioBlob, "recording.webm");

      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults(data);
      // Simulate slight delay for cinematic effect
      setTimeout(() => setStage("results"), 1500);
    } catch (error) {
      console.error("Analysis failed", error);
      // fallback or error state handling here
      setStage("capture");
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0f] to-[#0a0a0f] pb-20 -z-10" />

      <AnimatePresence mode="wait">
        {stage === "hero" && (
          <Hero key="hero" onStart={() => setStage("capture")} />
        )}
        
        {stage === "capture" && (
          <AudioCapture key="capture" onComplete={handleCaptureComplete} />
        )}

        {stage === "analyzing" && (
          <Analyzing key="analyzing" />
        )}

        {stage === "results" && results && (
          <BodyInsights key="results" data={results} onReset={() => setStage("hero")} />
        )}
      </AnimatePresence>
    </main>
  );
}
