import { Info } from "lucide-react";

export function CatalogPreviewNotice() {
  return (
    <aside
      role="status"
      className="mx-auto mb-6 flex w-full max-w-6xl items-start gap-3 rounded-glass-sm border border-[#dfbd70] bg-[#fff8e6]/90 px-4 py-3 text-sm text-[#684713] shadow-sm backdrop-blur-xl"
    >
      <Info size={18} className="mt-0.5 shrink-0 text-[#9b6917]" aria-hidden="true" />
      <p>
        Preview catalog: these sample products and prices are for development only.
        Live catalog data will appear after the storefront Supabase views are installed.
      </p>
    </aside>
  );
}
