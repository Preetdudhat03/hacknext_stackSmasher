"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const analysisSteps = [
  "Extracting acoustic features...",
  "Running MFCC proxy models...",
  "Mapping pitch variance...",
  "Evaluating respiratory patterns...",
  "Generating holistic health insights..."
];

export default function Analyzing() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 1500); // changes text every 1.5s while waiting for backend
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center space-y-12 h-[50vh]"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="w-48 h-48 rounded-full border-t border-indigo-500 absolute mix-blend-screen"
        />
        {/* Inner rotating ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-32 h-32 rounded-full border-b border-pink-500 absolute mix-blend-screen"
        />
        {/* Center core */}
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-16 h-16 bg-white rounded-full shadow-[0_0_40px_rgba(255,255,255,0.8)]"
        />
      </div>

      <motion.p
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-xl font-light tracking-widest text-indigo-200"
      >
        {analysisSteps[currentStep]}
      </motion.p>
    </motion.div>
  );
}
