/** Quiet ledger-paper backdrop: a faint ruled grid fading into the page,
 *  with one restrained brass wash near the top. No colored glow blobs. */
export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Faint dot grid — reads as ruled paper, fades toward the bottom */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 10%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 10%, transparent 80%)",
        }}
      />

      {/* Single restrained brass wash, top-center */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: "50vh",
          background: "radial-gradient(ellipse 70% 90% at 50% -10%, rgba(200,134,46,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Horizontal rule at ~30% — the one deliberate "ledger line" */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "30%",
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(200,134,46,0.08) 50%, transparent 100%)",
        }}
      />

      {/* Vignette edges */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 120% 120% at 50% 50%, transparent 60%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
}
