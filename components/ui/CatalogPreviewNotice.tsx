import { Info } from "lucide-react";

export function CatalogPreviewNotice() {
  return (
    <aside
      role="status"
      className="mx-auto mb-6 flex w-full max-w-6xl items-start gap-3 rounded-glass-sm border border-accent2/30 bg-accent2/10 px-4 py-3 text-sm text-ink/85 backdrop-blur-xl"
    >
      <Info size={18} className="mt-0.5 shrink-0 text-accent2" aria-hidden="true" />
      <p>
        Preview catalog: these sample products and prices are for development only.
        Live catalog data will appear after the storefront Supabase views are installed.
      </p>
    </aside>
  );
}
