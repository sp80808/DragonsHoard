
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltContainerProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TiltContainer: React.FC<TiltContainerProps> = ({ children, className = "", disabled = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Mouse position relative to the center of the element (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse movement
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Map mouse position to rotation degrees
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [12, -12]); // Reversed for natural tilt
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-12, 12]);

  // Map mouse position to glare opacity and position
  const glareOpacity = useTransform(mouseYSpring, [-0.5, 0.5], [0, 0.4]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (disabled) {
      return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative transition-all duration-200 ${className}`}
    >
      <div style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>

      {/* Glare Effect */}
      <motion.div 
        className="absolute inset-0 z-50 pointer-events-none rounded-xl mix-blend-overlay"
        style={{
            opacity: glareOpacity,
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)`,
            transform: "translateZ(1px)" // Sit slightly above content
        }}
      />
    </motion.div>
  );
};
