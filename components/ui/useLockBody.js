"use client";
import { useEffect } from "react";

/** Locks page scroll while `locked` is true, compensating for the scrollbar width. */
export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
    };
  }, [locked]);
}
