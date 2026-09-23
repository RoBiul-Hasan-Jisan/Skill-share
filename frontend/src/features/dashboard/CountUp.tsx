"use client";

import { useState, useEffect } from "react";
import { useMotionValue, useTransform, animate } from "framer-motion";

export function CountUp({ to, duration = 1.2, className }: { to: number; duration?: number; className?: string }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => (to >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toString()));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(motionVal, to, { duration, ease: "easeOut" });
    const unsub = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  return <span className={className}>{display}</span>;
}
