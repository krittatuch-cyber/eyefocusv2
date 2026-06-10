// app/(seller)/seller/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Store, Percent, FileText, Bell, Shield, Check, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";

type Section = "shop" | "tax" | "receipt" | "notify" | "security";

const SECTIONS: { id: Section; icon: any; labelTh: string; labelEn: string }[] = [
  { id: "shop",     icon: Store,    labelTh: "ข้อมูลร้านค้า",    labelEn: "Shop Info" },
  { id: "tax",      icon: Percent,  labelTh: "การตั้งค่าภาษี",   labelEn: "Tax Settings" },
  { id: "receipt",  icon: FileText, labelTh: "ใบเสร็จ/บิล",      labelEn: "Receipt Template" },
  { id: "notify",   icon: Bell,     labelTh: "การแจ้งเตือน",     labelEn: "Notifications" },
  { id: "security", icon: Shield,   labelTh: "ความปลอดภัย",      labelEn: "Security" },
];

export default function SettingsPage() {
  const { locale } = useI18n();
  const [activeSection, setActiveSection] = useState<Section>("shop");
  const [saved, setSaved] = useState<Section | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [shopSaving, setShopSaving] = useState(false);
  const [shopSaveError, setShopSaveError] = useState<string | null>(null);

  const [shopForm, setShopForm] = useState({
    name: "",
    taxId: "",
    phone: "",
    address: "",
    website: "",
    logoUrl: "",
  });

  const [taxForm, setTaxForm] = useState({ vatEnabled: true, vatRate: "7", includeVatInPrice: false });
  const [receiptForm, setReceiptForm] = useState({
    header: "Eye Focus — Optical Shop",
    footer: "ขอบคุณที่ใช้บริการ / Thank you for your visit",
    showLogo: true,
    showSignature: false,
  });
  const [notifyForm, setNotifyForm] = useState({
    lineNotify: true,
    emailAlerts: false,
    lowStockAlert: true,
    lowStockThreshold: "3",
  });
  const [secForm, setSecForm] = useState({ sessionTimeout: "60", requirePin: false });

  // ── Fetch tenant data on mount ──────────────────────────────────────────────
  useEffect(() => {
    setTenantLoading(true);
    fetch("/api/tenant", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setShopForm({
          name: data.name ?? "",
          taxId: data.taxId ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          website: "",
          logoUrl: data.logoUrl ?? "",
        });
        setTenantError(null);
      })
      .catch((e) => setTenantError(e.message || "ไม่สามารถโหลดข้อมูลร้านค้าได้"))
      .finally(() => setTenantLoading(false));
  }, []);

  // ── Save shop settings ──────────────────────────────────────────────────────
  const handleSaveShop = async () => {
    setShopSaveError(null);
    setShopSaving(true);
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shopForm.name,
          taxId: shopForm.taxId,
          phone: shopForm.phone,
          address: shopForm.address,
          logoUrl: shopForm.logoUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSaved("shop");
      setTimeout(() => setSaved(null), 2000);
    } catch (e: any) {
      setShopSaveError(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setShopSaving(false);
    }
  };

  // ── Generic local save (other sections) ────────────────────────────────────
  const handleSave = (s: Section) => {
    setSaved(s);
    setTimeout(() => setSaved(null), 2000);
  };

  // ── Sub-components ──────────────────────────────────────────────────────────
  const InputField = ({
    label, value, onChange, type = "text",
  }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-accent/50 transition"
      />
    </div>
  );

  const Toggle = ({
    label, value, onChange, desc,
  }: { label: string; value: boolean; onChange: (v: boolean) => void; desc?: string }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</p>
        {desc && <p className="text-[10px] text-slate-400">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${value ? "bg-accent" : "bg-slate-300 dark:bg-slate-600"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  const SaveBtn = ({ section }: { section: Section }) => (
    <button
      onClick={() => (section === "shop" ? handleSaveShop() : handleSave(section))}
      disabled={section === "shop" && shopSaving}
      className={`mt-4 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed ${
        saved === section ? "bg-emerald-500 text-white" : "bg-accent hover:bg-accent-hover text-white"
      }`}
    >
      {section === "shop" && shopSaving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Check className="w-3.5 h-3.5" />
      )}
      {saved === section
        ? (locale === "th" ? "บันทึกแล้ว!" : "Saved!")
        : (locale === "th" ? "บันทึกการตั้งค่า" : "Save Settings")}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
          {locale === "th" ? "การตั้งค่าระบบ" : "System Settings"}
        </h2>
        <p className="text-xs text-slate-500">
          {locale === "th"
            ? "กำหนดค่าข้อมูลร้านค้า ภาษี ใบเสร็จ และการแจ้งเตือน"
            : "Configure shop info, tax, receipts, and notifications"}
        </p>
      </div>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="md:w-48 shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeSection === s.id
                    ? "bg-accent/10 text-accent"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span>{locale === "th" ? s.labelTh : s.labelEn}</span>
                {activeSection === s.id && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">

          {/* ── SHOP SECTION ──────────────────────────────────────────────────── */}
          {activeSection === "shop" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === "th" ? "ข้อมูลร้านค้า" : "Shop Information"}
              </h3>

              {/* Loading state */}
              {tenantLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {locale === "th" ? "กำลังโหลดข้อมูล..." : "Loading shop data..."}
                </div>
              )}

              {/* Load error */}
              {!tenantLoading && tenantError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-500 rounded-xl px-3 py-2.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {tenantError}
                </div>
              )}

              {/* Save error */}
              {shopSaveError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-500 rounded-xl px-3 py-2.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {shopSaveError}
                </div>
              )}

              {!tenantLoading && (
                <>
                  {/* Logo upload */}
                  <ImageUpload
                    label={locale === "th" ? "โลโก้ร้านค้า" : "Shop Logo"}
                    hint={locale === "th" ? "JPG, PNG, WEBP · แนะนำสัดส่วน 1:1 หรือ 4:1 · สูงสุด 10MB" : "JPG, PNG, WEBP · Square or wide logo recommended · Max 10MB"}
                    value={shopForm.logoUrl || null}
                    onChange={(v) => setShopForm((f) => ({ ...f, logoUrl: v ?? "" }))}
                    maxSizePx={800}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField
                      label={locale === "th" ? "ชื่อร้านค้า" : "Shop Name"}
                      value={shopForm.name}
                      onChange={(v) => setShopForm({ ...shopForm, name: v })}
                    />
                    <InputField
                      label={locale === "th" ? "เลขประจำตัวผู้เสียภาษี" : "Tax ID"}
                      value={shopForm.taxId}
                      onChange={(v) => setShopForm({ ...shopForm, taxId: v })}
                    />
                    <InputField
                      label={locale === "th" ? "เบอร์โทรศัพท์" : "Phone"}
                      value={shopForm.phone}
                      onChange={(v) => setShopForm({ ...shopForm, phone: v })}
                    />
                    <InputField
                      label="Website"
                      value={shopForm.website}
                      onChange={(v) => setShopForm({ ...shopForm, website: v })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                      {locale === "th" ? "ที่อยู่สำนักงานใหญ่" : "HQ Address"}
                    </label>
                    <textarea
                      value={shopForm.address}
                      onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none resize-none"
                    />
                  </div>
                  <SaveBtn section="shop" />
                </>
              )}
            </div>
          )}

          {/* ── TAX SECTION ───────────────────────────────────────────────────── */}
          {activeSection === "tax" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === "th" ? "การตั้งค่าภาษีมูลค่าเพิ่ม" : "VAT Settings"}
              </h3>
              <Toggle
                label={locale === "th" ? "เปิดใช้งานภาษีมูลค่าเพิ่ม" : "Enable VAT"}
                value={taxForm.vatEnabled}
                onChange={(v) => setTaxForm({ ...taxForm, vatEnabled: v })}
                desc={locale === "th" ? "ระบบจะคำนวณ VAT อัตโนมัติ" : "System will auto-calculate VAT"}
              />
              {taxForm.vatEnabled && (
                <InputField
                  label={locale === "th" ? "อัตรา VAT (%)" : "VAT Rate (%)"}
                  value={taxForm.vatRate}
                  onChange={(v) => setTaxForm({ ...taxForm, vatRate: v })}
                  type="number"
                />
              )}
              <Toggle
                label={locale === "th" ? "ราคาสินค้ารวม VAT แล้ว" : "Price includes VAT"}
                value={taxForm.includeVatInPrice}
                onChange={(v) => setTaxForm({ ...taxForm, includeVatInPrice: v })}
                desc={locale === "th" ? "ถ้าเปิด ราคาบนสินค้าจะรวม VAT แล้ว" : "Product prices already include VAT"}
              />
              <SaveBtn section="tax" />
            </div>
          )}

          {/* ── RECEIPT SECTION ───────────────────────────────────────────────── */}
          {activeSection === "receipt" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === "th" ? "เทมเพลตใบเสร็จ" : "Receipt Template"}
              </h3>
              <InputField
                label={locale === "th" ? "หัวใบเสร็จ" : "Receipt Header"}
                value={receiptForm.header}
                onChange={(v) => setReceiptForm({ ...receiptForm, header: v })}
              />
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                  {locale === "th" ? "ท้ายใบเสร็จ" : "Receipt Footer"}
                </label>
                <textarea
                  value={receiptForm.footer}
                  onChange={(e) => setReceiptForm({ ...receiptForm, footer: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none resize-none"
                />
              </div>
              <Toggle
                label={locale === "th" ? "แสดงโลโก้ในใบเสร็จ" : "Show logo on receipt"}
                value={receiptForm.showLogo}
                onChange={(v) => setReceiptForm({ ...receiptForm, showLogo: v })}
              />
              <Toggle
                label={locale === "th" ? "ช่องลายเซ็น" : "Signature field"}
                value={receiptForm.showSignature}
                onChange={(v) => setReceiptForm({ ...receiptForm, showSignature: v })}
              />
              <SaveBtn section="receipt" />
            </div>
          )}

          {/* ── NOTIFY SECTION ────────────────────────────────────────────────── */}
          {activeSection === "notify" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === "th" ? "การแจ้งเตือน" : "Notifications"}
              </h3>
              <Toggle
                label="LINE Notify"
                value={notifyForm.lineNotify}
                onChange={(v) => setNotifyForm({ ...notifyForm, lineNotify: v })}
                desc={locale === "th" ? "ส่งแจ้งเตือนออเดอร์ใหม่ผ่าน LINE" : "Send new order alerts via LINE"}
              />
              <Toggle
                label={locale === "th" ? "แจ้งเตือนอีเมล" : "Email Alerts"}
                value={notifyForm.emailAlerts}
                onChange={(v) => setNotifyForm({ ...notifyForm, emailAlerts: v })}
                desc={locale === "th" ? "รับสรุปรายงานประจำวันทางอีเมล" : "Receive daily summary reports by email"}
              />
              <Toggle
                label={locale === "th" ? "แจ้งเตือนสินค้าใกล้หมด" : "Low Stock Alert"}
                value={notifyForm.lowStockAlert}
                onChange={(v) => setNotifyForm({ ...notifyForm, lowStockAlert: v })}
              />
              {notifyForm.lowStockAlert && (
                <InputField
                  label={locale === "th" ? "จำนวนขั้นต่ำแจ้งเตือน" : "Min Stock Threshold"}
                  value={notifyForm.lowStockThreshold}
                  onChange={(v) => setNotifyForm({ ...notifyForm, lowStockThreshold: v })}
                  type="number"
                />
              )}
              <SaveBtn section="notify" />
            </div>
          )}

          {/* ── SECURITY SECTION ──────────────────────────────────────────────── */}
          {activeSection === "security" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === "th" ? "การตั้งค่าความปลอดภัย" : "Security Settings"}
              </h3>
              <InputField
                label={locale === "th" ? "หมดเวลา Session (นาที)" : "Session Timeout (minutes)"}
                value={secForm.sessionTimeout}
                onChange={(v) => setSecForm({ ...secForm, sessionTimeout: v })}
                type="number"
              />
              <Toggle
                label={locale === "th" ? "กำหนด PIN เพิ่มเติม" : "Require PIN for sensitive actions"}
                value={secForm.requirePin}
                onChange={(v) => setSecForm({ ...secForm, requirePin: v })}
                desc={locale === "th" ? "ต้องยืนยัน PIN ก่อนลบหรือยกเลิกออเดอร์" : "PIN required before deleting or voiding orders"}
              />
              <SaveBtn section="security" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
