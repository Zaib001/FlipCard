import { useEffect, useRef } from "react";
import { mountNeonParticles } from "../../animations/gsapParticles";

export default function AnimatedBackground() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const cleanup = mountNeonParticles(ref.current);
    return cleanup;
  }, []);

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 -z-10">
      {Array.from({ length: 120 }).map((_, i) => (
        <span
          key={i}
          className="bg-dot absolute h-[2px] w-[2px] rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: "rgba(var(--accent) / .6)",
            filter: "drop-shadow(0 0 6px rgba(var(--accent) / .8))"
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--accent)/.10)_0%,transparent_60%)]" />
    </div>
  );
}
