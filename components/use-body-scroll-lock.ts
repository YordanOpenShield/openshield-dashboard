"use client";

import { useEffect } from "react";

/** Locks body scroll when `locked` is true, restores on unmount. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [locked]);
}
