"use client";

import { useState, useEffect } from "react";

export interface TypewriterResult {
  displayed: string;
  done: boolean;
}

/**
 * Custom typewriter hook that types text character-by-character after an initial delay.
 */
export function useTypewriter(
  text: string,
  speed: number = 32,
  startDelay: number = 500
): TypewriterResult {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    let currentIndex = 0;
    let timer: NodeJS.Timeout;

    const delayTimeout = setTimeout(() => {
      timer = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayed(text.slice(0, currentIndex));
        } else {
          setDone(true);
          clearInterval(timer);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(delayTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
