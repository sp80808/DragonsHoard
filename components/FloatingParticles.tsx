import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
}

const FloatingParticles: React.FC = () => {
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Generate 5-20 particles with random positions and curved paths
  const [particles] = useState<Particle[]>(() => {
    const count = Math.floor(Math.random() * 16) + 5; // 5-20
    return Array.from({ length: count }, () => {
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      const endX = Math.random() * 100;
      const endY = Math.random() * 100;
      // Control points for Bézier curve
      const controlX = (startX + endX) / 2 + (Math.random() - 0.5) * 50;
      const controlY = (startY + endY) / 2 + (Math.random() - 0.5) * 50;
      return {
        id: Math.random().toString(36),
        startX,
        startY,
        endX,
        endY,
        controlX,
        controlY,
      };
    });
  });

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdle = () => {
      setSpeedMultiplier(2); // Fast when active
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setSpeedMultiplier(0.5); // Slow when idle
      }, 2000); // Idle after 2 seconds of no activity
    };

    // Event listeners for user activity
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('click', resetIdle);
    window.addEventListener('keydown', resetIdle);

    // Start with slow speed
    setSpeedMultiplier(0.5);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('click', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-30 blur-sm"
          animate={{
            x: [particle.startX + 'vw', particle.controlX + 'vw', particle.endX + 'vw'],
            y: [particle.startY + 'vh', particle.controlY + 'vh', particle.endY + 'vh'],
          }}
          transition={{
            duration: 20 / speedMultiplier, // Base 20s, faster when active
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94], // Cubic-bezier for smooth curve
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;