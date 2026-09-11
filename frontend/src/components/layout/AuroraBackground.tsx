/** Multi-layer premium atmospheric background.
 *  Pure black base with subtle depth layers — no cartoon blobs. */
export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

      {/* Layer 1: Faint dot grid — fades out toward bottom */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 10%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 10%, transparent 80%)",
        }}
      />

      {/* Layer 2: Top-center cyan glow (primary accent) */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: "55vh",
          background: "radial-gradient(ellipse 80% 100% at 50% -10%, rgba(59,130,246,0.09) 0%, transparent 70%)",
        }}
      />

      {/* Layer 3: Top-right secondary blue glow */}
      <div
        className="absolute top-0 right-0"
        style={{
          width: "50vw",
          height: "45vh",
          background: "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Layer 4: Subtle bottom-left depth */}
      <div
        className="absolute bottom-0 left-0"
        style={{
          width: "40vw",
          height: "35vh",
          background: "radial-gradient(ellipse 60% 80% at 0% 100%, rgba(59,130,246,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Layer 5: Horizontal hairline beam at ~30% height */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "30%",
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.06) 30%, rgba(99,102,241,0.06) 70%, transparent 100%)",
        }}
      />

      {/* Layer 6: Vignette edges */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 120% 120% at 50% 50%, transparent 60%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
}
