// components/ui/SortHeader.tsx — Clickable <th> with sort direction chevron
"use client";

import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { SortDir } from "@/lib/hooks/useSortPaginate";

interface SortHeaderProps {
  col: string;
  label: React.ReactNode;
  sortKey: string;
  dir: SortDir;
  onSort: (col: string) => void;
  className?: string;
  align?: "left" | "right" | "center";
}

export default function SortHeader({
  col,
  label,
  sortKey,
  dir,
  onSort,
  className = "",
  align = "left",
}: SortHeaderProps) {
  const active = sortKey === col;
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <th
      onClick={() => onSort(col)}
      className={`py-3 px-4 font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group transition
        ${active ? "text-accent" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}
        ${alignClass} ${className}`}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {label}
        {active ? (
          dir === "asc"
            ? <ChevronUp className="w-3.5 h-3.5 text-accent" />
            : <ChevronDown className="w-3.5 h-3.5 text-accent" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  );
}
