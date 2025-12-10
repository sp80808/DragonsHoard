
import React, { useEffect, useRef } from 'react';
import { useSpring, useMotionValue, useTransform, motion } from 'framer-motion';

interface CountUpProps {
  value: number;
  className?: string;
  prefix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({ value, className, prefix = '' }) => {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 15, mass: 1 });
  const displayValue = useTransform(springValue, (current) => Math.round(current).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest}`;
      }
    });
    return () => unsubscribe();
  }, [displayValue, prefix]);

  return <span ref={ref} className={className}>{prefix}{value.toLocaleString()}</span>;
};
