// components/ui/Pagination.tsx — Rows-per-page selector + page navigation
"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalRows: number;
  from: number;
  to: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  pageSizeOptions?: number[];
  locale?: string;
}

export default function Pagination({
  page,
  totalPages,
  totalRows,
  from,
  to,
  pageSize,
  onPage,
  onPageSize,
  pageSizeOptions = [20, 50, 100],
  locale = "th",
}: PaginationProps) {
  if (totalRows === 0) return null;

  // Generate visible page numbers (max 5)
  const getPageNumbers = () => {
    const nums: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (page > 3) nums.push("...");
      const start = Math.max(2, page - 1);
      const end   = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) nums.push(i);
      if (page < totalPages - 2) nums.push("...");
      nums.push(totalPages);
    }
    return nums;
  };

  const btnBase = "w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition";
  const btnActive = "bg-accent text-white shadow-sm";
  const btnInactive = "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
  const btnDisabled = "text-slate-300 dark:text-slate-600 cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t border-slate-100 dark:border-slate-800">
      {/* Left: summary */}
      <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
        {locale === "th"
          ? `แสดง ${from.toLocaleString()}–${to.toLocaleString()} จาก ${totalRows.toLocaleString()} รายการ`
          : `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${totalRows.toLocaleString()}`}
      </p>

      {/* Center: page numbers */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPage(1)}
          disabled={page === 1}
          className={`${btnBase} ${page === 1 ? btnDisabled : btnInactive}`}
          title={locale === "th" ? "หน้าแรก" : "First"}
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className={`${btnBase} ${page === 1 ? btnDisabled : btnInactive}`}
          title={locale === "th" ? "หน้าก่อน" : "Prev"}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {getPageNumbers().map((n, i) =>
          n === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-slate-400">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`${btnBase} ${n === page ? btnActive : btnInactive}`}
            >
              {n}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} ${page === totalPages ? btnDisabled : btnInactive}`}
          title={locale === "th" ? "หน้าถัดไป" : "Next"}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        {/* Last */}
        <button
          onClick={() => onPage(totalPages)}
          disabled={page === totalPages}
          className={`${btnBase} ${page === totalPages ? btnDisabled : btnInactive}`}
          title={locale === "th" ? "หน้าสุดท้าย" : "Last"}
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: rows per page */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {locale === "th" ? "แถว/หน้า" : "Rows/page"}:
        </span>
        <div className="flex items-center gap-1">
          {pageSizeOptions.map(sz => (
            <button
              key={sz}
              onClick={() => onPageSize(sz)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                pageSize === sz
                  ? "bg-accent text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
