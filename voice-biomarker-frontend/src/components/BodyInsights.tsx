"use client";

import { motion } from "framer-motion";
import { Activity, Brain, Wind } from "lucide-react";
import { useState } from "react";

interface BodyInsightsProps {
  data: any;
  onReset: () => void;
}

export default function BodyInsights({ data, onReset }: BodyInsightsProps) {
  const [activeSystem, setActiveSystem] = useState<string | null>(null);

  const { analysis } = data;
  const { results, health_score, risk_level, system_insights } = analysis || {
    health_score: 85,
    risk_level: "low",
    system_insights: {
      respiratory: { status: "normal", insight: "Lung capacity normal", score: 90 },
      neurological: { status: "warning", insight: "Micro-tremors detected", score: 75 },
      emotional: { status: "normal", insight: "Balanced energy", score: 90 }
    }
  };

  const getSystemColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-500 shadow-green-500/50";
      case "warning": return "bg-amber-500 shadow-amber-500/50";
      case "high_risk": return "bg-red-500 shadow-red-500/50";
      default: return "bg-indigo-500 shadow-indigo-500/50";
    }
  };

  const getTextColor = (status: string) => {
    switch (status) {
      case "normal": return "text-green-400";
      case "warning": return "text-amber-400";
      case "high_risk": return "text-red-400";
      default: return "text-indigo-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between px-6 gap-12"
    >
      {/* Left Column: Summary */}
      <div className="flex-1 flex flex-col space-y-6">
        <h2 className="text-4xl font-bold">Diagnostic Complete</h2>
        <div className="glass-panel p-8 relative overflow-hidden">
          <div className="flex items-end gap-4 mb-4">
            <span className="text-7xl font-black">{health_score}</span>
            <span className="text-gray-400 mb-2">/ 100</span>
          </div>
          <p className="text-xl font-medium tracking-wide">
            Risk Profile: <span className="uppercase text-white">{risk_level}</span>
          </p>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity className="w-32 h-32" />
          </div>
        </div>

        <button
          onClick={onReset}
          className="self-start px-6 py-3 border border-indigo-500/30 rounded-full hover:bg-indigo-500/10 transition-colors text-indigo-300"
        >
          New Scan
        </button>
      </div>

      {/* Center Column: Abstract Body mapping */}
      <div className="flex-1 relative h-[600px] flex items-center justify-center">
         {/* Simple SVG Silhouette Abstract */}
         <svg viewBox="0 0 200 500" className="w-full h-full max-w-[250px] opacity-20 relative z-0">
            <path d="M100,20 C120,20 135,35 135,55 C135,75 120,90 100,90 C80,90 65,75 65,55 C65,35 80,20 100,20 Z" fill="white" />
            <path d="M60,100 C80,95 120,95 140,100 C160,110 180,140 180,180 L180,280 C180,300 160,300 160,280 L160,180 C160,160 140,140 120,140 L80,140 C60,140 40,160 40,180 L40,280 C40,300 20,300 20,280 L20,180 C20,140 40,110 60,100 Z" fill="white" />
            <path d="M70,140 L130,140 L130,280 L150,480 C150,500 120,500 110,480 L100,340 L90,480 C80,500 50,500 50,480 L70,280 Z" fill="white" />
         </svg>

         {/* Hotspots matching body systems */}
         {/* Neurological / Brain */}
         <motion.div
           onHoverStart={() => setActiveSystem("neurological")}
           onHoverEnd={() => setActiveSystem(null)}
           animate={{ scale: activeSystem === "neurological" ? 1.5 : 1 }}
           className={`absolute top-[12%] w-12 h-12 rounded-full blur-xl cursor-pointer transition-colors ${getSystemColor(system_insights.neurological.status)}`}
         />
         
         {/* Respiratory / Lungs */}
         <motion.div
           onHoverStart={() => setActiveSystem("respiratory")}
           onHoverEnd={() => setActiveSystem(null)}
           animate={{ scale: activeSystem === "respiratory" ? 1.5 : 1 }}
           className={`absolute top-[32%] w-24 h-24 rounded-full blur-xl cursor-pointer transition-colors ${getSystemColor(system_insights.respiratory.status)}`}
         />

         {/* Emotional / Core */}
         <motion.div
           onHoverStart={() => setActiveSystem("emotional")}
           onHoverEnd={() => setActiveSystem(null)}
           animate={{ scale: activeSystem === "emotional" ? 1.5 : 1 }}
           className={`absolute top-[48%] w-16 h-16 rounded-full blur-xl cursor-pointer transition-colors ${getSystemColor(system_insights.emotional.status)}`}
         />
      </div>

      {/* Right Column: Dynamic Detail Cards */}
      <div className="flex-1 flex flex-col space-y-4">
        <h3 className="text-xl text-gray-400 border-b border-white/10 pb-2 mb-4">Biomarker Insights</h3>
        
        {/* Neurological */}
        <motion.div 
          animate={{ opacity: activeSystem === "neurological" || !activeSystem ? 1 : 0.3 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <Brain className={`w-5 h-5 ${getTextColor(system_insights.neurological.status)}`} />
            <h4 className="font-semibold text-lg">Neurological</h4>
            <span className="ml-auto text-sm bg-white/5 px-2 py-1 rounded">{system_insights.neurological.score}</span>
          </div>
          <p className="text-sm text-gray-400">{system_insights.neurological.insight}</p>
        </motion.div>

        {/* Respiratory */}
        <motion.div 
          animate={{ opacity: activeSystem === "respiratory" || !activeSystem ? 1 : 0.3 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <Wind className={`w-5 h-5 ${getTextColor(system_insights.respiratory.status)}`} />
            <h4 className="font-semibold text-lg">Respiratory</h4>
            <span className="ml-auto text-sm bg-white/5 px-2 py-1 rounded">{system_insights.respiratory.score}</span>
          </div>
          <p className="text-sm text-gray-400">{system_insights.respiratory.insight}</p>
        </motion.div>

        {/* Emotional */}
        <motion.div 
          animate={{ opacity: activeSystem === "emotional" || !activeSystem ? 1 : 0.3 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className={`w-5 h-5 ${getTextColor(system_insights.emotional.status)}`} />
            <h4 className="font-semibold text-lg">Emotional Resonance</h4>
            <span className="ml-auto text-sm bg-white/5 px-2 py-1 rounded">{system_insights.emotional.score}</span>
          </div>
          <p className="text-sm text-gray-400">{system_insights.emotional.insight}</p>
        </motion.div>

      </div>
    </motion.div>
  );
}
