"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll-in reveal (legacy "Animations" panel, default Style: Slide, Speed:
 * Medium — see --anim-* tokens in styles/tokens.css). Fires once: pair the
 * returned ref with a data-animate="slide" element and spread
 * data-animate-visible when `visible` is true. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
