"use client";

import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";

const fitOpts = {
  padding: 0.25,
  duration: 200,
  minZoom: 0.15,
  maxZoom: 1.35,
} as const;

/** Call after graph changes so the new node is visible (prompt_fix Part 3). */
export function FlowFitView({ nonce }: { nonce: number }) {
  const { fitView } = useReactFlow();
  const resizeT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (nonce === 0) return;
    const t = setTimeout(() => {
      void fitView(fitOpts);
    }, 100);
    return () => clearTimeout(t);
  }, [nonce, fitView]);

  useEffect(() => {
    const schedule = () => {
      if (resizeT.current) clearTimeout(resizeT.current);
      resizeT.current = setTimeout(() => {
        resizeT.current = null;
        void fitView({ ...fitOpts, duration: 0 });
      }, 150);
    };
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("resize", schedule);
      if (resizeT.current) clearTimeout(resizeT.current);
    };
  }, [fitView]);

  return null;
}
