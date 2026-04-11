"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface AudioCaptureProps {
  onComplete: (audioBlob: Blob) => void;
}

export default function AudioCapture({ onComplete }: AudioCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        onComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone", error);
      alert("Microphone access is required to use this experience.");
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isRecording && countdown === 0) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
    return () => clearTimeout(timer);
  }, [isRecording, countdown]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center relative w-full h-[60vh]"
    >
      {!isRecording ? (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={startRecording}
          className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(99,102,241,0.5)]"
        >
          <span className="text-white text-lg font-medium">Tap to Speak</span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-indigo-400 opacity-50 pointer-events-none"
          />
        </motion.button>
      ) : (
        <div className="flex flex-col items-center">
          {/* Reactive Glowing Aura Mock */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1, 1.8, 1.2, 1],
                opacity: [0.5, 0.8, 0.4, 1, 0.6, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-pink-500/30 blur-2xl"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center z-10"
            >
              <span className="text-4xl font-light text-white">{countdown}</span>
            </motion.div>
          </div>
          <p className="text-xl text-gray-300 font-light tracking-wide">
            "Read a few sentences out loud..."
          </p>
        </div>
      )}
    </motion.div>
  );
}
