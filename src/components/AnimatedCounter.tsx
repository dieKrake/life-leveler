"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  type: "xp" | "gems" | "streak";
  className?: string;
  formatValue?: (value: number) => string;
  renderWrapper?: (children: ReactNode, isAnimating: boolean, scaleIntensity: number) => ReactNode;
}

export default function AnimatedCounter({
  value,
  type,
  className = "",
  formatValue = (val) => val.toLocaleString(),
  renderWrapper,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);
  const targetValueRef = useRef(value);

  // Motion value for the counter
  const motionValue = useMotionValue(value);
  
  // Spring animation with dynamic config
  const spring = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
  });

  // Transform spring value to display value
  const animatedValue = useTransform(spring, (latest) => Math.round(latest));

  // Different animation configs based on type
  const getAnimationConfig = (oldVal: number, newVal: number) => {
    const diff = Math.abs(newVal - oldVal);
    
    switch (type) {
      case "streak":
        // Streak: Always +1, slow and prominent (1.5-2s)
        return {
          duration: 1500,
          stiffness: 60,
          damping: 25,
          scaleIntensity: 1.4, // Increased for more prominence
        };
      
      case "xp":
        // XP: Usually 40+, fast counting (0.5-1s)
        return {
          duration: Math.min(800, Math.max(400, diff * 8)),
          stiffness: 150,
          damping: 20,
          scaleIntensity: 1.25, // Increased for more visibility
        };
      
      case "gems":
        // Gems: Variable, adaptive speed (0.3-1.2s)
        const baseDuration = diff <= 5 ? 600 : diff <= 20 ? 800 : 1000;
        return {
          duration: Math.min(1200, Math.max(300, baseDuration)),
          stiffness: diff <= 5 ? 120 : diff <= 20 ? 100 : 80,
          damping: 25,
          scaleIntensity: diff <= 5 ? 1.3 : diff <= 20 ? 1.25 : 1.2, // Increased for all ranges
        };
      
      default:
        return {
          duration: 600,
          stiffness: 100,
          damping: 30,
          scaleIntensity: 1.1,
        };
    }
  };

  useEffect(() => {
    const prevValue = prevValueRef.current;
    
    if (prevValue !== value) {
      const config = getAnimationConfig(prevValue, value);
      
      // Start animation
      setIsAnimating(true);
      
      // Update motion value to trigger spring animation
      motionValue.set(value);

      prevValueRef.current = value;
      targetValueRef.current = value;
    }
  }, [value, motionValue, type]);

  // Update display value from animated value and handle animation state
  useEffect(() => {
    const unsubscribe = animatedValue.on("change", (latest) => {
      const roundedLatest = Math.round(latest);
      setDisplayValue(roundedLatest);
      
      // Stop animation when we reach the current target value
      if (Math.abs(latest - targetValueRef.current) < 0.01) {
        setIsAnimating(false);
      }
    });

    return unsubscribe;
  }, [animatedValue]);

  const config = getAnimationConfig(prevValueRef.current, value);

  // Get glow color based on type
  const getGlowColor = () => {
    switch (type) {
      case "streak":
        return "0 0 20px rgba(251, 146, 60, 0.8)"; // Orange glow
      case "xp":
        return "0 0 20px rgba(251, 191, 36, 0.8)"; // Yellow glow
      case "gems":
        return "0 0 20px rgba(96, 165, 250, 0.8)"; // Blue glow
      default:
        return "none";
    }
  };

  const counterElement = (
    <motion.span
      className={className}
      animate={{
        scale: renderWrapper ? 1 : (isAnimating ? config.scaleIntensity : 1),
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        duration: 0.3,
      }}
      style={{
        display: "inline-block",
        transformOrigin: "center",
        textShadow: isAnimating ? getGlowColor() : "none",
        filter: isAnimating ? "brightness(1.2)" : "brightness(1)",
      }}
    >
      {formatValue(displayValue)}
    </motion.span>
  );

  if (renderWrapper) {
    return renderWrapper(counterElement, isAnimating, config.scaleIntensity) as JSX.Element;
  }

  return counterElement;
}
