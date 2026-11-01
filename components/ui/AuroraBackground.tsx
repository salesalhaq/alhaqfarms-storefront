/**
 * Decorative ambient background: a soft animated aurora mesh plus film grain.
 * Purely presentational, hidden from assistive tech, and removed entirely in
 * "low effects" mode (see globals.css).
 */
import { CursorLight } from "@/components/ui/CursorLight";

/**
 * Decorative ambient background: a soft animated aurora mesh plus film grain.
 * Purely presentational, hidden from assistive tech, and removed entirely in
 * "low effects" mode (see globals.css).
 */
export function AuroraBackground() {
  return (
    <>
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="grain" aria-hidden="true" />
      <CursorLight />
    </>
  );
}
