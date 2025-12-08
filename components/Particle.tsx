import React from 'react';
import { Particle as ParticleType, ParticleType as PType } from '../types';

interface ParticleProps {
  particle: ParticleType;
}

/**
 * Individual Particle component
 * Renders a single particle based on its type and properties
 */
export const Particle: React.FC<ParticleProps> = ({ particle }) => {
  if (!particle.active) return null;

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${particle.x}px`,
    top: `${particle.y}px`,
    opacity: particle.alpha,
    transition: 'none',
    pointerEvents: 'none',
    zIndex: 1000,
  };

  // Render different particle types with specific styles
  switch (particle.type) {
    case 'xp':
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: particle.color,
            boxShadow: `0 0 8px ${particle.color}`,
          }}
          className="w-2 h-2 rounded-full"
        />
      );

    case 'gold':
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: particle.color,
            boxShadow: `0 0 10px ${particle.color}`,
          }}
          className="w-3 h-3 rounded-full"
        />
      );

    case 'spark':
      // Sparks are smaller, more intense particles for merge effects
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: particle.color,
            boxShadow: `0 0 6px ${particle.color}, 0 0 12px ${particle.color}`,
            transform: `scale(${particle.alpha})`, // Shrink as they fade
          }}
          className="w-1.5 h-1.5 rounded-full"
        />
      );

    case 'ember':
      // Embers are floating particles for combo auras
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: particle.color,
            boxShadow: `0 0 4px ${particle.color}`,
            filter: 'blur(1px)',
          }}
          className="w-1 h-1 rounded-full"
        />
      );

    default:
      // Generic particle fallback
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: particle.color,
          }}
          className="w-2 h-2 rounded-full"
        />
      );
  }
};

export default Particle;
