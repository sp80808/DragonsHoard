
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Star } from 'lucide-react';
import { generateId } from '../utils/rng';

type LootType = 'GOLD' | 'XP';

interface LootParticle {
  id: string;
  type: LootType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

interface LootContextType {
  registerTarget: (type: LootType, element: HTMLElement | null) => void;
  spawnLoot: (type: LootType, sourceRect: DOMRect, count?: number) => void;
  triggerImpact: (type: LootType) => void; // Used to manually trigger HUD bumps if needed
}

const LootContext = createContext<LootContextType | null>(null);

export const useLootSystem = () => {
  const context = useContext(LootContext);
  if (!context) throw new Error("useLootSystem must be used within a LootProvider");
  return context;
};

export const LootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [particles, setParticles] = useState<LootParticle[]>([]);
  const targets = useRef<Record<LootType, HTMLElement | null>>({ GOLD: null, XP: null });

  const registerTarget = useCallback((type: LootType, element: HTMLElement | null) => {
    targets.current[type] = element;
  }, []);

  const spawnLoot = useCallback((type: LootType, sourceRect: DOMRect, count: number = 8) => {
    const targetEl = targets.current[type];
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    // Center of target
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    // Center of source
    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;

    const newParticles: LootParticle[] = Array.from({ length: count }).map(() => ({
      id: generateId(),
      type,
      startX,
      startY,
      targetX,
      targetY
    }));

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const removeParticle = (id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <LootContext.Provider value={{ registerTarget, spawnLoot, triggerImpact: () => {} }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        <AnimatePresence>
          {particles.map(p => (
            <FlyingParticle key={p.id} particle={p} onComplete={() => removeParticle(p.id)} />
          ))}
        </AnimatePresence>
      </div>
    </LootContext.Provider>
  );
};

const FlyingParticle: React.FC<{ particle: LootParticle, onComplete: () => void }> = ({ particle, onComplete }) => {
  // Random spread for the "burst" effect
  const spreadX = (Math.random() - 0.5) * 100;
  const spreadY = (Math.random() - 0.5) * 100;

  return (
    <motion.div
      initial={{ 
        x: particle.startX, 
        y: particle.startY, 
        scale: 0,
        opacity: 1 
      }}
      animate={{ 
        x: [particle.startX, particle.startX + spreadX, particle.targetX],
        y: [particle.startY, particle.startY + spreadY, particle.targetY],
        scale: [0.5, 1.2, 0.5],
        opacity: [1, 1, 0],
        rotate: [0, Math.random() * 360]
      }}
      transition={{ 
        duration: 0.8, 
        times: [0, 0.4, 1],
        ease: "easeInOut"
      }}
      onAnimationComplete={onComplete}
      className="absolute top-0 left-0"
    >
      {particle.type === 'GOLD' ? (
        <div className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
          <Coins size={20} fill="currentColor" />
        </div>
      ) : (
        <div className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          <Star size={20} fill="currentColor" />
        </div>
      )}
    </motion.div>
  );
};
