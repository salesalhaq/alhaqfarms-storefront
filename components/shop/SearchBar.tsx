"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  /** Pre-fills the field; used when the shop page already has a query. */
  defaultValue?: string;
}

/**
 * Storefront search. Submits to the shop page so results are shareable and
 * linkable rather than held in component state.
 */
export function SearchBar({ placeholder, className, defaultValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
      }}
      className={cn("glass flex items-center gap-2 rounded-full py-2 pl-4 pr-2", className)}
    >
      <Search size={18} aria-hidden="true" className="shrink-0 text-muted" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? "Search products"}
        className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-accent px-4 py-2 text-[0.8125rem] font-medium text-on-accent transition-all duration-300 ease-spring hover:brightness-110 active:scale-[0.97]"
      >
        Search
      </button>
    </form>
  );
}
