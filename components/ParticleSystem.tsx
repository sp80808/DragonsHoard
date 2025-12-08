import React, { useEffect, useRef, useState } from 'react';
import { Particle, ParticleConfig, ParticleType } from '../types';

const PARTICLE_POOL_SIZE = 200;
const PHYSICS_FPS = 60;
const FRAME_TIME = 1000 / PHYSICS_FPS;

interface ParticleSystemProps {
  particles: Particle[];
  onUpdate: (particles: Particle[]) => void;
}

/**
 * ParticleSystem manages the particle pool and rendering
 * Uses DOM-based particles for better performance with <100 particles
 */
export const ParticleSystem: React.FC<ParticleSystemProps> = ({ particles, onUpdate }) => {
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Update particles physics every frame
  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }

      const elapsed = currentTime - lastFrameTimeRef.current;

      // Only update at target FPS
      if (elapsed >= FRAME_TIME) {
        const updatedParticles = particles.map((p) => {
          if (!p.active) return p;

          const newAge = p.age + elapsed;
          const progress = newAge / p.lifetime;
          const alpha = Math.max(0, 1 - progress); // Fade out

          // Apply physics
          let vx = p.vx;
          let vy = p.vy;

          if (p.gravity) {
            vy += 0.3; // Gravity acceleration
          }

          const newX = p.x + vx;
          const newY = p.y + vy;

          return {
            ...p,
            x: newX,
            y: newY,
            vx,
            vy,
            alpha,
            age: newAge,
            active: newAge < p.lifetime,
          };
        });

        onUpdate(updatedParticles);
        lastFrameTimeRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles, onUpdate]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {particles.map((p) => {
        if (!p.active) return null;

        const style = {
          position: 'fixed' as const,
          left: `${p.x}px`,
          top: `${p.y}px`,
          opacity: p.alpha,
          transition: 'none',
          pointerEvents: 'none' as const,
          zIndex: 1000,
        };

        // Render different particle types
        switch (p.type) {
          case 'xp':
            return (
              <div
                key={p.id}
                style={style}
                className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg"
              />
            );

          case 'gold':
            return (
              <div
                key={p.id}
                style={style}
                className="w-2 h-2 rounded-full bg-yellow-400 shadow-lg font-bold text-xs"
              >
                $
              </div>
            );

          case 'spark':
            return (
              <div
                key={p.id}
                style={style}
                className="w-1.5 h-1.5 rounded-full shadow-lg"
                style={{
                  ...style,
                  backgroundColor: p.color,
                }}
              />
            );

          case 'ember':
            return (
              <div
                key={p.id}
                style={style}
                className="w-2 h-2 rounded-full bg-orange-500 shadow-lg"
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

/**
 * ParticlePool manages allocation and reuse of particles
 */
export class ParticlePool {
  private particles: Particle[] = [];
  private activeCount = 0;

  constructor(size: number = PARTICLE_POOL_SIZE) {
    // Pre-allocate particles
    for (let i = 0; i < size; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return {
      id: Math.random().toString(36),
      type: 'spark',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      alpha: 1,
      lifetime: 0,
      age: 0,
      active: false,
      gravity: false,
    };
  }

  spawn(config: ParticleConfig): Particle | null {
    if (this.activeCount >= this.particles.length) {
      return null; // Pool exhausted
    }

    const particle = this.particles[this.activeCount];

    // Calculate velocity based on start and end positions
    let vx = 0;
    let vy = 0;

    if (config.endPos) {
      const duration = config.lifetime / 1000; // Convert to seconds
      vx = (config.endPos.x - config.startPos.x) / (config.lifetime / FRAME_TIME);
      vy = (config.endPos.y - config.startPos.y) / (config.lifetime / FRAME_TIME);
    } else if (config.velocity) {
      vx = config.velocity.x;
      vy = config.velocity.y;
    }

    particle.id = Math.random().toString(36);
    particle.type = config.type;
    particle.x = config.startPos.x;
    particle.y = config.startPos.y;
    particle.vx = vx;
    particle.vy = vy;
    particle.color = config.color;
    particle.alpha = 1;
    particle.lifetime = config.lifetime;
    particle.age = 0;
    particle.active = true;
    particle.gravity = config.gravity || false;

    this.activeCount++;
    return particle;
  }

  spawnBurst(config: ParticleConfig, count: number): Particle[] {
    const results: Particle[] = [];

    for (let i = 0; i < count; i++) {
      // Randomize velocity for burst effect
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 2;

      const particleConfig: ParticleConfig = {
        ...config,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
      };

      const particle = this.spawn(particleConfig);
      if (particle) {
        results.push(particle);
      }
    }

    return results;
  }

  update(): Particle[] {
    // Return list of active particles
    return this.particles.slice(0, this.activeCount).filter((p) => p.active);
  }

  cleanup(): Particle[] {
    // Remove inactive particles from active list
    let writeIndex = 0;

    for (let i = 0; i < this.activeCount; i++) {
      if (this.particles[i].active) {
        if (i !== writeIndex) {
          const temp = this.particles[i];
          this.particles[i] = this.particles[writeIndex];
          this.particles[writeIndex] = temp;
        }
        writeIndex++;
      }
    }

    this.activeCount = writeIndex;
    return this.particles.slice(0, this.activeCount);
  }

  getActiveParticles(): Particle[] {
    return this.particles.slice(0, this.activeCount);
  }

  getStats() {
    return {
      total: this.particles.length,
      active: this.activeCount,
      usage: ((this.activeCount / this.particles.length) * 100).toFixed(1) + '%',
    };
  }
}
