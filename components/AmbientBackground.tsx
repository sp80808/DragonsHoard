import React, { useEffect, useRef } from 'react';

interface AmbientBackgroundProps {
  lowPerformanceMode: boolean;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({ lowPerformanceMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (lowPerformanceMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number, y: number, size: number, speedY: number, speedX: number, opacity: number }[] = [];
    const particleCount = 40; // Moderate count

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            speedY: Math.random() * 0.5 + 0.1,
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1
        });
    }

    const render = () => {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(p => {
            p.y -= p.speedY;
            p.x += p.speedX;
            
            // Reset if out of bounds
            if (p.y < -10) {
                p.y = height + 10;
                p.x = Math.random() * width;
            }

            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 200, 150, ${p.opacity})`; // Golden ember color
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        animationRef.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [lowPerformanceMode]);

  if (lowPerformanceMode) return null;

  return (
    <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-0 opacity-60 mix-blend-screen"
    />
  );
});