export function AeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg select-none"
    >
      <div className="aero-backdrop-parallax absolute inset-0 origin-center">
        <img
          src="/images/neo-aero-light.webp"
          alt=""
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-100 dark:opacity-0"
        />
        <img
          src="/images/neo-aero-dark.webp"
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-0 dark:opacity-100"
        />
      </div>
      {/* Adaptive readability veil tuned to the sky/ribbon luminosity of the paired wallpapers */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(240,253,244,0.42)_0%,rgba(240,253,244,0.12)_48%,rgba(240,253,244,0.34)_100%)] dark:bg-[linear-gradient(180deg,rgba(3,18,14,0.52)_0%,rgba(3,18,14,0.20)_50%,rgba(3,18,14,0.46)_100%)]" />
    </div>
  );
}
