import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelUpBannerProps {
  level: number;
  isVisible: boolean;
}

export const LevelUpBanner: React.FC<LevelUpBannerProps> = ({ level, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.2, y: -50 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.6
          }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600
                        text-white text-center py-6 px-8 rounded-b-2xl
                        border-x-4 border-b-4 border-cyan-400
                        shadow-[0_0_30px_rgba(6,182,212,0.6)]
                        backdrop-blur-md min-w-[300px]">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="text-5xl font-black tracking-wider fantasy-font mb-2"
            >
              LEVEL {level}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg opacity-90 font-medium"
            >
              New abilities unlocked!
            </motion.div>
            {/* Sparkle effects */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    delay: 0.1 * i,
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  style={{
                    left: `${20 + i * 10}%`,
                    top: `${10 + (i % 2) * 60}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
