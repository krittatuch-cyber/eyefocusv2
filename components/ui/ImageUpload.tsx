// components/ui/ImageUpload.tsx — Reusable image browse + upload component
// Uses client-side canvas resize + JPEG compress → base64 (no external storage needed)
"use client";

import React, { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;           // current base64 or URL
  onChange: (base64: string | null) => void;
  label?: string;
  hint?: string;
  maxSizePx?: number;              // max width/height in px (default 400)
  quality?: number;                // JPEG quality 0–1 (default 0.78)
  className?: string;
  disabled?: boolean;
}

/**
 * Resize + compress an image file to base64 using Canvas.
 * Returns a data:image/jpeg;base64,... string.
 */
async function compressImage(
  file: File,
  maxSizePx: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxSizePx / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

export default function ImageUpload({
  value,
  onChange,
  label,
  hint,
  maxSizePx = 240,
  quality = 0.72,
  className = "",
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกิน 10MB");
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const base64 = await compressImage(file, maxSizePx, quality);
      onChange(base64);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setProcessing(false);
    }
  }, [maxSizePx, quality, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setError(null);
  };

  const hasImage = !!value;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none overflow-hidden
          ${hasImage ? "border-transparent p-0" : "p-6"}
          ${dragging ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10" : hasImage ? "" : "border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 bg-slate-50 dark:bg-slate-800/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {/* Preview */}
        {hasImage && (
          <div className="relative group">
            <img
              src={value!}
              alt="preview"
              className="w-full h-48 object-cover rounded-xl"
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
              <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> เปลี่ยนรูป
              </span>
            </div>
            {/* Clear button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasImage && (
          <div className="flex flex-col items-center gap-3 text-center">
            {processing ? (
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-violet-500 dark:text-violet-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {processing ? "กำลังประมวลผล..." : "คลิกเพื่อเลือกรูป"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hint ?? "JPG, PNG, WEBP · สูงสุด 10MB · ปรับขนาดอัตโนมัติ"}
              </p>
            </div>
            {!processing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition">
                <Upload className="w-3.5 h-3.5" />
                Browse รูป
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
}
