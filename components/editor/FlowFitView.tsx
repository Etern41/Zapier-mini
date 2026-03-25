"use client";

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

/** Call after graph changes so the new node is visible (prompt_fix Part 3). */
export function FlowFitView({ nonce }: { nonce: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nonce === 0) return;
    const t = setTimeout(() => {
      void fitView({ padding: 0.2, duration: 200 });
    }, 100);
    return () => clearTimeout(t);
  }, [nonce, fitView]);

  return null;
}
