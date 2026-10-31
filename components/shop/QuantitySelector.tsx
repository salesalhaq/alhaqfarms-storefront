"use client";

import { Minus, Plus } from "lucide-react";
import { quantityStep, toDecimalQuantity } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  unitCode: string;
  quantityMilli: number;
  onChange: (newMilli: number) => void;
  maxMilli?: number | null;
  className?: string;
}

export function QuantitySelector({
  unitCode,
  quantityMilli,
  onChange,
  maxMilli,
  className,
}: QuantitySelectorProps) {
  const step = quantityStep(unitCode) * 1000;
  const displayValue = toDecimalQuantity(quantityMilli);

  const handleDecrease = () => {
    const next = Math.max(step, quantityMilli - step);
    onChange(next);
  };

  const handleIncrease = () => {
    const next = quantityMilli + step;
    if (maxMilli !== undefined && maxMilli !== null && next > maxMilli) return;
    onChange(next);
  };

  return (
    <div className={cn("glass-line flex items-center gap-1 rounded-full p-1", className)}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantityMilli <= step}
        className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-line/10 hover:text-ink disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      
      <div className="min-w-[3rem] px-2 text-center text-sm font-semibold text-ink">
        {displayValue} <span className="text-[10px] text-muted">{unitCode}</span>
      </div>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={maxMilli !== undefined && maxMilli !== null && quantityMilli >= maxMilli}
        className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-line/10 hover:text-ink disabled:opacity-30"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
