"use client";

import { motion } from "framer-motion";
import { Mic } from "lucide-react";

interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center text-center max-w-3xl px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 1 }}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-indigo-300"
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        Vocal Biomarker Analysis
      </motion.div>
      
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
        Your Voice is the <br />
        <span className="text-gradient">Key to Your Health</span>
      </h1>
      
      <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed">
        Speak naturally for 15 seconds. Our AI maps subtle acoustic variations to your respiratory, neurological, and emotional systems.
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="relative group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        <Mic className="w-6 h-6 group-hover:text-white transition-colors" />
        <span className="group-hover:text-white transition-colors">Start Health Scan</span>
      </motion.button>
    </motion.div>
  );
}
