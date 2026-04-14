"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface StampRevealProps {
  show: boolean;
  stampEmoji: string;
  stampLabel: string;
  points: number;
  onClose: () => void;
}

export function StampReveal({ show, stampEmoji, stampLabel, points, onClose }: StampRevealProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(t);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-card-border"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: 2, duration: 0.4 }}
              className="text-6xl"
            >
              {stampEmoji}
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-bold">Stamp Earned!</p>
              <p className="text-sm text-muted">{stampLabel}</p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-accent font-bold text-sm mt-2"
              >
                +{points} points
              </motion.p>
            </div>
          </motion.div>

          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i * Math.PI * 2) / 12) * 120,
                y: Math.sin((i * Math.PI * 2) / 12) * 120,
                opacity: 0,
              }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="absolute w-2 h-2 rounded-full bg-accent"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
