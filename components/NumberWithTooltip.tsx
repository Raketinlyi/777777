"use client";

import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NumberType = "cr" | "percent" | "plain" | "wei";

export interface NumberWithTooltipProps {
  value: number | string | bigint;
  type?: NumberType; // cr: OCTAA decimals; percent: %; plain: number; wei: bigint to OCTAA
  fractionDigits?: number; // shown in main text
  preciseDigits?: number; // shown in tooltip
  showSign?: boolean; // for percent
  suffix?: string; // e.g. "OCTAA", "%" will be auto for percent if not provided
  className?: string;
  alignRight?: boolean;
  disabled?: boolean; // disable tooltip
}

function toNumber(val: number | string): number {
  if (typeof val === "number") return val;
  const n = Number(val);
  return isFinite(n) ? n : 0;
}

function formatNumber(n: number, digits: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(n);
}

function formatPercent(n: number, digits: number, showSign: boolean) {
  const sign = showSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function formatWeiToCRAA(wei: bigint, digits: number) {
  // 1 CRAA = 1e18 wei
  const str = wei.toString();
  const pad = str.padStart(19, "0");
  const intPart = pad.slice(0, -18);
  const fracPart = pad.slice(-18);
  const asNum = Number(`${intPart}.${fracPart}`);
  return formatNumber(asNum, digits);
}

export const NumberWithTooltip: React.FC<NumberWithTooltipProps> = ({
  value,
  type = "cr",
  fractionDigits,
  preciseDigits,
  showSign = false,
  suffix,
  className,
  alignRight,
  disabled,
}) => {
  // Read global preference once (default true)
  const [enabled, setEnabled] = React.useState(true);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("tooltipsEnabled");
      if (raw != null) setEnabled(raw === "true");
    } catch {}
  }, []);

  let display = "";
  let tooltip = "";
  const baseClass = cn(
    // Ровная типографика числа + суффикса, неразрывная связка
    "tabular-nums leading-none inline-flex items-baseline whitespace-nowrap gap-1",
    alignRight && "text-right",
    className
  );

  if (type === "percent") {
    const n = typeof value === "number" ? value : toNumber(value as string);
    const d = fractionDigits ?? 1;
    const p = preciseDigits ?? Math.max(d, 2);
    display = formatPercent(n, d, showSign);
    tooltip = formatPercent(n, p, showSign);
    suffix = suffix ?? "";
  } else if (type === "plain") {
    const n = typeof value === "number" ? value : toNumber(value as string);
    const d = fractionDigits ?? 0;
    const p = preciseDigits ?? Math.max(d, 2);
    display = formatNumber(n, d);
    tooltip = formatNumber(n, p);
  } else if (type === "wei") {
    const d = fractionDigits ?? 2;
    const p = preciseDigits ?? 6;
    display = formatWeiToCRAA(value as bigint, d);
    tooltip = formatWeiToCRAA(value as bigint, p);
    suffix = suffix ?? "OCTAA";
  } else {
    // cr
    const n = typeof value === "number" ? value : toNumber(value as string);
    const d = fractionDigits ?? 2;
    const p = preciseDigits ?? 6;
    display = formatNumber(n, d);
    tooltip = formatNumber(n, p);
    suffix = suffix ?? "OCTAA";
  }

  const text = (
    <span
      className={baseClass}
      title={`${tooltip}${suffix ? " " + suffix : ""}`}
      aria-label={`${tooltip}${suffix ? " " + suffix : ""}`}
    >
      <span className={suffix === "OCTAA" ? "font-black text-black" : ""}>{display}</span>
      {suffix ? <span className={cn("opacity-80", suffix === "OCTAA" && "font-black text-black")}>{suffix}</span> : null}
    </span>
  );

  if (disabled || !enabled) return text;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {text}
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-mono tabular-nums">{tooltip}{suffix ? " " + suffix : ""}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NumberWithTooltip;
