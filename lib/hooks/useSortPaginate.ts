// lib/hooks/useSortPaginate.ts
// Shared hook: sort (localStorage-persisted) + client-side pagination
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

interface UseSortPaginateOptions<T> {
  data: T[];
  defaultSort: SortState;
  /** localStorage key prefix to persist sort (e.g. "customers") */
  storageKey: string;
  defaultPageSize?: number;
  /** Optional custom comparator for a given key */
  comparators?: Partial<Record<string, (a: T, b: T) => number>>;
}

export function useSortPaginate<T extends Record<string, any>>({
  data,
  defaultSort,
  storageKey,
  defaultPageSize = 20,
  comparators = {},
}: UseSortPaginateOptions<T>) {
  // ── Sort state (persisted) ────────────────────────────────────────────────
  const [sort, setSortRaw] = useState<SortState>(() => {
    if (typeof window === "undefined") return defaultSort;
    try {
      const saved = localStorage.getItem(`eyefocus_sort_${storageKey}`);
      if (saved) return JSON.parse(saved) as SortState;
    } catch {}
    return defaultSort;
  });

  // Toggle sort when clicking same column; set new column ascending
  // Uses setSortRaw with functional updater (correctly typed) + persists to localStorage inline
  const onSort = useCallback((key: string) => {
    setSortRaw((prev: SortState): SortState => {
      const next: SortState = prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" };
      try {
        localStorage.setItem(`eyefocus_sort_${storageKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    setPage(1);
  }, [storageKey]);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Reset to page 1 when data changes (e.g. after search/filter)
  useEffect(() => { setPage(1); }, [data.length]);

  // ── Sorted data ───────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const { key, dir } = sort;
    if (!key) return data;
    const mul = dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      if (comparators[key]) return mul * comparators[key]!(a, b);
      const av = a[key];
      const bv = b[key];
      if (av === null || av === undefined) return mul;
      if (bv === null || bv === undefined) return -mul;
      if (typeof av === "number" && typeof bv === "number") return mul * (av - bv);
      return mul * String(av).localeCompare(String(bv), "th", { sensitivity: "base" });
    });
  }, [data, sort, comparators]);

  // ── Paged slice ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);

  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  const onPageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    /** Sorted + paged rows to render */
    rows: paged,
    /** All sorted rows (for export etc.) */
    sortedAll: sorted,
    sort,
    onSort,
    page: safePage,
    setPage,
    pageSize,
    onPageSize,
    totalPages,
    totalRows: sorted.length,
    from: sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, sorted.length),
  };
}
