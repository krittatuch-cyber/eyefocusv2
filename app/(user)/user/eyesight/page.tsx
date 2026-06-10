// app/(user)/user/eyesight/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { db, dbHelper } from "@/lib/db-mock";
import { Eye, User, Save, History, FileText, ChevronRight } from "lucide-react";

export default function EyesightPage() {
  const { t, locale, formatDate } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustList, setShowCustList] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Input states
  const [sphR, setSphR] = useState("-1.00");
  const [cylR, setCylR] = useState("");
  const [axisR, setAxisR] = useState("");
  const [pdR, setPdR] = useState("32");
  const [addR, setAddR] = useState("");
  
  const [sphL, setSphL] = useState("-1.00");
  const [cylL, setCylL] = useState("");
  const [axisL, setAxisL] = useState("");
  const [pdL, setPdL] = useState("32");
  const [addL, setAddL] = useState("");

  const [notes, setNotes] = useState("");

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    const currentUser = storedUser ? JSON.parse(storedUser) : db.users[2];
    setUser(currentUser);
  }, []);

  const loadCustomerPrescriptions = (custId: string) => {
    const history = db.eyePrescriptions
      .filter((ep) => ep.customerId === custId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    setHistoryList(history);
  };

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setShowCustList(false);
    loadCustomerPrescriptions(cust.id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !user) {
      alert(locale === "th" ? "กรุณาเลือกลูกค้าก่อนบันทึก" : "Please select a customer first");
      return;
    }

    const prescriptionData = {
      sphR: parseFloat(sphR) || 0,
      cylR: cylR ? parseFloat(cylR) : null,
      axisR: axisR ? parseInt(axisR) : null,
      pdR: parseFloat(pdR) || 32,
      addR: addR ? parseFloat(addR) : null,
      sphL: parseFloat(sphL) || 0,
      cylL: cylL ? parseFloat(cylL) : null,
      axisL: axisL ? parseInt(axisL) : null,
      pdL: parseFloat(pdL) || 32,
      addL: addL ? parseFloat(addL) : null,
      notes
    };

    dbHelper.addEyePrescription(selectedCustomer.id, user.id, prescriptionData);
    loadCustomerPrescriptions(selectedCustomer.id);
    
    // Clear inputs
    setNotes("");
    alert(locale === "th" ? "บันทึกประวัติค่าสายตาเรียบร้อย!" : "Eye prescription saved successfully!");
  };

  const filteredCustomers = db.customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  return (
    <div className="space-y-4">
      {/* 1. Customer Selector */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3 relative">
        <div className="flex items-center space-x-1.5">
          <User className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {locale === "th" ? "เลือกลูกค้าสำหรับวัดสายตา" : "Select Customer"}
          </h3>
        </div>

        <div className="relative">
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setShowCustList(true);
              if (selectedCustomer) setSelectedCustomer(null);
            }}
            onFocus={() => setShowCustList(true)}
            placeholder={t("selectCustomerPlaceholder")}
            className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />

          {showCustList && customerSearch && (
            <div className="absolute left-0 right-0 top-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto z-40 shadow-xl p-1.5 space-y-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center p-3 text-slate-400 text-xs">
                  {locale === "th" ? "ไม่พบรายชื่อ" : "No customers found"}
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="text-slate-900 dark:text-white">{cust.name}</p>
                      <span className="text-[10px] text-slate-400">{cust.phone}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Structured Prescription Input Form */}
      {selectedCustomer && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-4">
          <div className="flex items-center space-x-1.5">
            <Eye className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("eyeRefraction")} : {selectedCustomer.name}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Headers */}
            <div className="grid grid-cols-6 gap-1 text-[8px] font-extrabold uppercase text-center text-slate-400 leading-none">
              <div>ตา (Eye)</div>
              <div>SPH</div>
              <div>CYL</div>
              <div>AXIS</div>
              <div>PD</div>
              <div>ADD</div>
            </div>

            {/* Right Eye R */}
            <div className="grid grid-cols-6 gap-1.5 items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">R</span>
              <input
                type="number" step="0.25" value={sphR}
                onChange={(e) => setSphR(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" step="0.25" placeholder="0.00" value={cylR}
                onChange={(e) => setCylR(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" placeholder="0" value={axisR}
                onChange={(e) => setAxisR(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" step="0.5" value={pdR}
                onChange={(e) => setPdR(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" step="0.25" placeholder="0.00" value={addR}
                onChange={(e) => setAddR(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            {/* Left Eye L */}
            <div className="grid grid-cols-6 gap-1.5 items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">L</span>
              <input
                type="number" step="0.25" value={sphL}
                onChange={(e) => setSphL(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" step="0.25" placeholder="0.00" value={cylL}
                onChange={(e) => setCylL(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" placeholder="0" value={axisL}
                onChange={(e) => setAxisL(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" step="0.5" value={pdL}
                onChange={(e) => setPdL(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <input
                type="number" step="0.25" placeholder="0.00" value={addL}
                onChange={(e) => setAddL(e.target.value)}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("notes")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุโน้ตสำหรับการประกอบแว่นตา..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex justify-center items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              <span>{locale === "th" ? "บันทึกค่าสายตา" : "Save Prescription"}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Customer Prescription History Comparative Timeline */}
      {selectedCustomer && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-1.5">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("lastMeasurements")}
            </h3>
          </div>

          {historyList.length === 0 ? (
            <p className="text-center py-4 text-slate-400 text-xs">{locale === "th" ? "ไม่มีประวัติสายตาเก่า" : "No history recorded"}</p>
          ) : (
            <div className="space-y-4">
              {historyList.map((ep, idx) => (
                <div
                  key={ep.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl space-y-2 relative"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-accent">{formatDate(ep.recordedAt)}</span>
                    <span className="text-slate-400">
                      {t("prescribedBy")}: {db.users.find(u => u.id === ep.recorderId)?.name || "Optometrist"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-200/40 dark:border-slate-800/60 pt-1.5">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 uppercase">Right (R)</p>
                      <p className="text-slate-500">SPH: <span className="font-bold text-slate-700 dark:text-slate-300">{ep.sphR}</span> | CYL: <span className="font-semibold">{ep.cylR || "0.00"}</span></p>
                      <p className="text-slate-500">AXIS: <span className="font-semibold">{ep.axisR || "0"}°</span> | PD: <span className="font-semibold">{ep.pdR}</span> | ADD: <span className="font-semibold">{ep.addR || "0.00"}</span></p>
                    </div>
                    <div className="space-y-0.5 border-l border-slate-200/40 dark:border-slate-800/60 pl-2.5">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 uppercase">Left (L)</p>
                      <p className="text-slate-500">SPH: <span className="font-bold text-slate-700 dark:text-slate-300">{ep.sphL}</span> | CYL: <span className="font-semibold">{ep.cylL || "0.00"}</span></p>
                      <p className="text-slate-500">AXIS: <span className="font-semibold">{ep.axisL || "0"}°</span> | PD: <span className="font-semibold">{ep.pdL}</span> | ADD: <span className="font-semibold">{ep.addL || "0.00"}</span></p>
                    </div>
                  </div>

                  {ep.notes && (
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-[9px] text-slate-600 dark:text-slate-400 mt-1">
                      <span className="font-bold">{t("notes")}:</span> {ep.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
