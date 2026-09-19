"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

export type RevealProps = {
  children: ReactNode;
  /** Milliseconds to wait after coming into view, to stagger a row of cards. */
  delay?: number;
  className?: string;
};

/**
 * Fades and lifts its content in the first time it scrolls into view. Motion
 * only for visitors who have not asked their device to reduce it — for them
 * the content is simply there (the `motion-safe:` variants).
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Synchronises with the browser's IntersectionObserver: reveal once, then stop watching.
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        visible ? "translate-y-0 opacity-100" : "motion-safe:translate-y-6 motion-safe:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
