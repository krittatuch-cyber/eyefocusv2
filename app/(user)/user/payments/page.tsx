// app/(user)/user/payments/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { db } from "@/lib/db-mock";
import { FileText, Search, CreditCard, DollarSign, Tag, CheckCircle2, ChevronRight } from "lucide-react";

export default function PaymentsPage() {
  const { t, locale, formatCurrency, formatDate } = useI18n();

  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadOrders = () => {
    setOrders([...db.orders].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-1.5">
        <FileText className="w-5 h-5 text-accent" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
          {locale === "th" ? "ประวัติการชำระเงินและบิลสาขา" : "Receipts & Payment Logs"}
        </h2>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={locale === "th" ? "ค้นหาเลขบิล INV-..." : "Search invoice number..."}
          className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
        />
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Order Logs list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 text-center text-slate-400 rounded-2xl border text-xs">{t("empty")}</div>
        ) : (
          filtered.map((ord) => {
            const customer = db.customers.find(c => c.id === ord.customerId);
            return (
              <div
                key={ord.id}
                className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-2.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">{ord.orderNumber}</h3>
                    <p className="text-[9px] text-slate-400">{formatDate(ord.createdAt)} | {ord.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    ord.status === "PAID" 
                      ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600" 
                      : "bg-amber-100 dark:bg-amber-950/20 text-amber-500"
                  }`}>
                    {ord.status === "PAID" ? t("paymentStatus_PAID") : t("paymentStatus_PENDING")}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 py-1.5 border-y border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span>{locale === "th" ? "ชื่อลูกค้า" : "Customer"}:</span>
                    <span className="ml-1 font-semibold text-slate-800 dark:text-slate-200">
                      {customer ? customer.name : t("noCustomer")}
                    </span>
                  </div>
                  <div>
                    <span>{locale === "th" ? "ช่องทาง" : "Method"}:</span>
                    <span className="ml-1 font-semibold text-slate-800 dark:text-slate-200">
                      {ord.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span className="text-slate-500">{t("netAmount")}</span>
                  <span className="text-accent text-sm font-black">{formatCurrency(ord.netAmount)}</span>
                </div>

                {/* e-Tax indicator */}
                {ord.isETaxRequested && (
                  <div className="flex items-center text-[8px] font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    <span>{t("taxInvoiceTitle")} (e-Tax) : {t("taxSendSuccess")}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
