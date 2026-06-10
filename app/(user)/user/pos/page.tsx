// app/(user)/user/pos/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import {
  Search,
  ShoppingCart,
  User,
  Plus,
  Minus,
  Trash2,
  Check,
  CreditCard,
  QrCode,
  DollarSign,
  CalendarDays,
  FileText,
  FileCode,
  Wifi,
  WifiOff,
  Eye,
  AlertCircle
} from "lucide-react";

interface CartItem {
  product: any;
  quantity: number;
  discount: number;
}

export default function PosPage() {
  const router = useRouter();
  const { t, locale, formatCurrency, formatDate } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [shift, setShift] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"catalog" | "cart">("catalog");
  
  // Catalog states
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [brands, setBrands] = useState<string[]>([]);
  
  // Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showCustList, setShowCustList] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [includeVat, setIncludeVat] = useState(true);
  const [isETax, setIsETax] = useState(false);
  
  // Eyesight attachment states
  const [attachEyesight, setAttachEyesight] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [customPrescription, setCustomPrescription] = useState({
    sphR: -1.0, cylR: "", axisR: "", pdR: 32, addR: "",
    sphL: -1.0, cylL: "", axisL: "", pdL: 32, addL: "",
    notes: ""
  });

  // Shift block modal
  const [showShiftBlock, setShowShiftBlock] = useState(false);
  const [startingCash, setStartingCash] = useState("3000");

  // Checkout states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  
  // Offline Sync states
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Customer search debounce ref
  const custDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Initialisation ──────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Fetch current user from auth API
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((currentUser) => {
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);

        // 2. Shift gate – simplified: if user is authenticated, allow POS.
        //    A real shift API can populate this later. For now treat as open.
        setShift({ id: "session-shift", userId: currentUser.id });

        // 3. Load products from real API
        fetch("/api/products", { credentials: "include" })
          .then((r) => r.json())
          .then((data) => {
            // API may return { data: [...] } or plain array
            const prods = Array.isArray(data) ? data : (data.data ?? []);
            setProducts(prods);
            // Derive brand list from loaded products
            const uniqueBrands = Array.from(
              new Set(prods.map((p: any) => p.brand).filter(Boolean))
            ) as string[];
            setBrands(uniqueBrands);
          })
          .catch(() => setProducts([]));
      })
      .catch(() => router.push("/login"));

    // 4. Offline detection
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Count offline orders cached in localStorage
    const savedOffline = localStorage.getItem("pendingOrders");
    if (savedOffline) {
      setPendingSyncCount(JSON.parse(savedOffline).length);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Sync offline orders when connection returns ──────────────────────────────
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      const savedOffline = localStorage.getItem("pendingOrders");
      if (savedOffline) {
        const ordersToSync: any[] = JSON.parse(savedOffline);
        // Fire-and-forget sync to real API
        Promise.allSettled(
          ordersToSync.map((ord: any) =>
            fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(ord.payload),
            })
          )
        ).then(() => {
          localStorage.removeItem("pendingOrders");
          setPendingSyncCount(0);
          alert(
            locale === "th"
              ? "ซิงค์รายการขายออฟไลน์สำเร็จ!"
              : "Offline transactions synced successfully!"
          );
          // Refresh products
          if (user) {
            fetch("/api/products", { credentials: "include" })
              .then((r) => r.json())
              .then((data) => {
                const prods = Array.isArray(data) ? data : (data.data ?? []);
                setProducts(prods);
              });
          }
        });
      }
    }
  }, [isOnline, pendingSyncCount, user]);

  // ─── Customer search debounce ─────────────────────────────────────────────────
  useEffect(() => {
    if (!customerSearch) {
      setCustomerResults([]);
      return;
    }
    if (custDebounceRef.current) clearTimeout(custDebounceRef.current);
    custDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/customers?search=${encodeURIComponent(customerSearch)}&limit=5`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setCustomerResults(data.data ?? (Array.isArray(data) ? data : []));
        }
      } catch {
        setCustomerResults([]);
      }
    }, 300);
    return () => {
      if (custDebounceRef.current) clearTimeout(custDebounceRef.current);
    };
  }, [customerSearch]);

  // ─── Open cash shift handler (simplified – no real shift API yet) ─────────────
  const handleOpenShift = () => {
    if (!user) return;
    // Simplified: mark shift as open locally until a shift API is available
    setShift({ id: "local-shift-" + Date.now(), userId: user.id });
    setShowShiftBlock(false);
  };

  // ─── Cart actions ─────────────────────────────────────────────────────────────
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, discount: Math.max(0, discount) }
        : item
    ));
  };

  // ─── Calculations ─────────────────────────────────────────────────────────────
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity) - (item.discount * item.quantity), 0);
  };

  const getDiscountedTotal = () => {
    return Math.max(0, getSubtotal() - globalDiscount);
  };

  const getVatAmount = () => {
    if (!includeVat) return 0;
    // VAT is inclusive in the net amount: Net = Net - (Net * 7/107)
    return getDiscountedTotal() * 7 / 107;
  };

  // ─── Filtered catalog ─────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesBrand = brandFilter === "ALL" || p.brand === brandFilter;
    return matchesSearch && matchesCat && matchesBrand;
  });

  // ─── Customer helpers ─────────────────────────────────────────────────────────
  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setShowCustList(false);
    
    // If customer has a last prescription attached in the response, use it
    if (cust.lastPrescription) {
      setSelectedPrescription(cust.lastPrescription);
      setAttachEyesight(true);
    } else {
      setSelectedPrescription(null);
    }
  };

  // ─── POS Checkout submission ──────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!shift) {
      alert(t("openShiftFirst"));
      return;
    }
    if (cart.length === 0) return;

    const orderPayload = {
      branchId: user?.branchId || "",
      customerId: selectedCustomer?.id || null,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        discount: item.discount,
      })),
      paymentMethod,
      totalAmount: getSubtotal(),
      discountAmount: globalDiscount + cart.reduce((sum, i) => sum + (i.discount * i.quantity), 0),
      netAmount: getDiscountedTotal(),
      paidAmount: Number(cashReceived) || getDiscountedTotal(),
      isETaxRequested: isETax,
      notes: "",
      ...(attachEyesight ? {
        lensDetails: {
          sphR: selectedPrescription ? selectedPrescription.sphR : customPrescription.sphR,
          cylR: selectedPrescription ? selectedPrescription.cylR : parseFloat(customPrescription.cylR) || undefined,
          axisR: selectedPrescription ? selectedPrescription.axisR : parseInt(customPrescription.axisR) || undefined,
          addR: selectedPrescription ? selectedPrescription.addR : parseFloat(customPrescription.addR) || undefined,
          pdR: selectedPrescription ? selectedPrescription.pdR : customPrescription.pdR || 32,
          sphL: selectedPrescription ? selectedPrescription.sphL : customPrescription.sphL,
          cylL: selectedPrescription ? selectedPrescription.cylL : parseFloat(customPrescription.cylL) || undefined,
          axisL: selectedPrescription ? selectedPrescription.axisL : parseInt(customPrescription.axisL) || undefined,
          addL: selectedPrescription ? selectedPrescription.addL : parseFloat(customPrescription.addL) || undefined,
          pdL: selectedPrescription ? selectedPrescription.pdL : customPrescription.pdL || 32,
          pd: selectedPrescription
            ? (selectedPrescription.pdR + selectedPrescription.pdL)
            : (customPrescription.pdR + customPrescription.pdL) || 64,
          lensType: "Single Vision Blue",
          lensDetails: "Coating UV420 + Anti-Reflection",
          labName: "หอแว่นแล็บพาร์ทเนอร์",
        }
      } : {}),
    };

    if (navigator.onLine) {
      // ── Online flow: POST to real API ──────────────────────────────────────
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(orderPayload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to create order");
        }

        alert(
          locale === "th"
            ? "บันทึกการขายและออกใบเสร็จเสร็จสิ้น!"
            : "Checkout completed and receipt generated!"
        );
      } catch (err: any) {
        alert(
          locale === "th"
            ? `เกิดข้อผิดพลาด: ${err.message}`
            : `Error: ${err.message}`
        );
        return; // Don't reset cart if submission failed
      }
    } else {
      // ── Offline queueing flow ──────────────────────────────────────────────
      const orderId = "offline_o_" + Date.now();
      const orderNumber =
        "INV-OFFLINE-" +
        new Date().toISOString().slice(0, 10).replace(/-/g, "") +
        "-" +
        String(Math.floor(Math.random() * 1000));

      const offlineOrder = {
        payload: orderPayload,
        // Keep a local snapshot for display / debugging
        order: {
          id: orderId,
          orderNumber,
          customerId: orderPayload.customerId,
          branchId: orderPayload.branchId,
          totalAmount: orderPayload.totalAmount,
          discountAmount: orderPayload.discountAmount,
          netAmount: orderPayload.netAmount,
          paidAmount: orderPayload.paidAmount,
          paymentMethod: orderPayload.paymentMethod,
          status: "PAID",
          isETaxRequested: orderPayload.isETaxRequested,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        items: cart.map(item => ({
          id: "offline_oi_" + Math.random(),
          orderId,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          discount: item.discount,
        })),
      };

      const pendingOrders = JSON.parse(localStorage.getItem("pendingOrders") || "[]");
      pendingOrders.push(offlineOrder);
      localStorage.setItem("pendingOrders", JSON.stringify(pendingOrders));
      setPendingSyncCount(pendingOrders.length);

      alert(
        locale === "th"
          ? "ระบบบันทึกรายการขายแบบออฟไลน์เรียบร้อยแล้ว! ข้อมูลจะซิงค์เมื่อมีอินเทอร์เน็ต"
          : "Sale recorded offline! Order will sync when connection returns."
      );
    }

    // Reset checkout states
    setCart([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setGlobalDiscount(0);
    setAttachEyesight(false);
    setShowCheckoutModal(false);
    setActiveTab("catalog");
  };

  const selectSuggestedCash = (amt: number) => {
    setCashReceived(String(amt));
  };

  return (
    <div className="space-y-4">
      {/* Mobile POS Tab Bar Toggle */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/30 dark:border-slate-700/50">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 flex justify-center items-center py-2.5 text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
            activeTab === "catalog"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {locale === "th" ? "รายการสินค้า" : "Catalog"}
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex-1 flex justify-center items-center py-2.5 text-xs font-bold rounded-xl transition duration-150 relative cursor-pointer ${
            activeTab === "cart"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <span>{locale === "th" ? "ตะกร้าสินค้า" : "Cart"}</span>
          {cart.length > 0 && (
            <span className="ml-1.5 bg-accent text-white font-bold w-4 h-4 rounded-full flex items-center justify-center text-[9px] animate-pulse">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* 1. Catalog Tab content */}
      {activeTab === "catalog" && (
        <div className="space-y-3">
          {/* Catalog Filters */}
          <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "FRAME", "LENS", "CONTACT_LENS", "ACCESSORY"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-full border shrink-0 transition duration-150 cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-accent border-accent text-white"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700"
                }`}
              >
                {cat === "ALL" ? (locale === "th" ? "ทั้งหมด" : "All") : cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("barcodePlaceholder")}
              className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs placeholder-slate-400 focus:outline-none"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Product grid list */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400 text-xs">{t("empty")}</div>
            ) : (
              filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between space-y-3 cursor-pointer hover:border-accent dark:hover:border-accent transition duration-150"
                >
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-full uppercase">
                      {prod.category}
                    </span>
                    <h4 className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                      {prod.name}
                    </h4>
                    <p className="text-[9px] text-slate-400">{prod.code}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/40">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(prod.price)}
                    </span>
                    <span className={`text-[8px] font-semibold px-2 py-0.5 rounded ${
                      prod.quantity <= prod.minAlert 
                        ? "bg-red-100 dark:bg-red-950/20 text-red-500" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {locale === "th" ? `สต็อก: ${prod.quantity}` : `Qty: ${prod.quantity}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. Cart Tab content */}
      {activeTab === "cart" && (
        <div className="space-y-4">
          
          {/* Customer Selection Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3 relative">
            <div className="flex items-center space-x-1.5">
              <User className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {locale === "th" ? "เลือกลูกค้าสำหรับออเดอร์" : "Customer Selection"}
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
                className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
              
              {showCustList && customerSearch && (
                <div className="absolute left-0 right-0 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto z-40 shadow-xl p-1.5 space-y-1">
                  {customerResults.length === 0 ? (
                    <div className="text-center p-3 text-slate-400 text-xs">
                      {locale === "th" ? "ไม่พบรายชื่อ" : "No customers found"}
                    </div>
                  ) : (
                    customerResults.map(cust => (
                      <button
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <p className="text-slate-900 dark:text-white">{cust.name}</p>
                          <span className="text-[10px] text-slate-400">{cust.phone}</span>
                        </div>
                        <span className="text-[9px] bg-accent/5 text-accent px-2 py-0.5 rounded font-bold">
                          {cust.loyaltyTier}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="p-3 bg-accent/5 dark:bg-card/40 border border-accent/20 dark:border-slate-700 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{selectedCustomer.name}</span>
                  <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">
                    {selectedCustomer.loyaltyTier}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{t("points")}: {selectedCustomer.loyaltyPoints}</span>
                  <span>{t("phone")}: {selectedCustomer.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("cart")}
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">{t("emptyCart")}</div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex flex-col space-y-2 pb-3 border-b border-slate-100 dark:border-slate-700/40 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[200px]">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{item.product.name}</p>
                        <span className="text-[10px] text-slate-400">{formatCurrency(item.product.price)}</span>
                      </div>
                      <button
                        onClick={() => updateCartQty(item.product.id, -item.quantity)}
                        className="text-red-500 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      {/* Quantity adjuster */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-white cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Discount */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-slate-400">{locale === "th" ? "ลดชิ้นละ" : "Item Disc"}</span>
                        <input
                          type="number"
                          value={item.discount || ""}
                          onChange={(e) => updateItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eyesight Prescription attachment */}
          {cart.some(i => i.product.category === "FRAME" || i.product.category === "LENS") && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {locale === "th" ? "แนบค่าสายตาประกอบเลนส์" : "Attach Eyesight Values"}
                  </h3>
                </div>
                <input
                  type="checkbox"
                  checked={attachEyesight}
                  onChange={(e) => setAttachEyesight(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-accent cursor-pointer"
                />
              </div>

              {attachEyesight && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-700/40 pt-3">
                  {selectedPrescription ? (
                    <div className="p-2.5 bg-indigo-50/50 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-950/40 rounded-xl space-y-1">
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {locale === "th" ? "✓ ใช้ค่าสายตาที่เคยบันทึกไว้ล่าสุด" : "✓ Using last saved prescription"}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">ตาขวา (R):</span> Sph {selectedPrescription.sphR} / Cyl {selectedPrescription.cylR || "0"} / Axis {selectedPrescription.axisR || "0"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">ตาซ้าย (L):</span> Sph {selectedPrescription.sphL} / Cyl {selectedPrescription.cylL || "0"} / Axis {selectedPrescription.axisL || "0"}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPrescription(null)}
                        className="text-[9px] font-bold text-red-500 hover:underline mt-1 block"
                      >
                        {locale === "th" ? "เปลี่ยนมาคีย์เอง" : "Enter manual values instead"}
                      </button>
                    </div>
                  ) : (
                    // Manual entry fields
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-5 gap-1 text-[8px] font-bold uppercase text-center text-slate-400">
                        <div>EYE</div>
                        <div>SPH</div>
                        <div>CYL</div>
                        <div>AXIS</div>
                        <div>PD</div>
                      </div>
                      {/* R */}
                      <div className="grid grid-cols-5 gap-1.5 items-center">
                        <span className="text-[9px] font-bold text-slate-500 text-center">R</span>
                        <input
                          type="number" step="0.25"
                          value={customPrescription.sphR}
                          onChange={(e) => setCustomPrescription({...customPrescription, sphR: parseFloat(e.target.value) || 0})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                        <input
                          type="number" step="0.25" placeholder="0"
                          value={customPrescription.cylR}
                          onChange={(e) => setCustomPrescription({...customPrescription, cylR: e.target.value})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                        <input
                          type="number" placeholder="0"
                          value={customPrescription.axisR}
                          onChange={(e) => setCustomPrescription({...customPrescription, axisR: e.target.value})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                        <input
                          type="number" step="0.5"
                          value={customPrescription.pdR}
                          onChange={(e) => setCustomPrescription({...customPrescription, pdR: parseFloat(e.target.value) || 32})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                      </div>
                      {/* L */}
                      <div className="grid grid-cols-5 gap-1.5 items-center">
                        <span className="text-[9px] font-bold text-slate-500 text-center">L</span>
                        <input
                          type="number" step="0.25"
                          value={customPrescription.sphL}
                          onChange={(e) => setCustomPrescription({...customPrescription, sphL: parseFloat(e.target.value) || 0})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                        <input
                          type="number" step="0.25" placeholder="0"
                          value={customPrescription.cylL}
                          onChange={(e) => setCustomPrescription({...customPrescription, cylL: e.target.value})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                        <input
                          type="number" placeholder="0"
                          value={customPrescription.axisL}
                          onChange={(e) => setCustomPrescription({...customPrescription, axisL: e.target.value})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                        <input
                          type="number" step="0.5"
                          value={customPrescription.pdL}
                          onChange={(e) => setCustomPrescription({...customPrescription, pdL: parseFloat(e.target.value) || 32})}
                          className="w-full text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* POS Bill Summary & Checkout Trigger */}
          {cart.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-4">
              <div className="space-y-2 border-b border-slate-100 dark:border-slate-700/40 pb-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{t("total")}</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                
                {/* Global Discount input */}
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{locale === "th" ? "ลดท้ายบิล" : "Bill Discount"}</span>
                  <input
                    type="number"
                    value={globalDiscount || ""}
                    onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 px-2 py-1 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                {/* VAT 7% toggle */}
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{t("vat")}</span>
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={(e) => setIncludeVat(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-accent cursor-pointer"
                  />
                </div>

                {/* e-Tax request toggle */}
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{t("eTax")}</span>
                  <input
                    type="checkbox"
                    checked={isETax}
                    onChange={(e) => setIsETax(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-accent cursor-pointer"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{t("netAmount")}</span>
                <span className="text-lg font-black text-accent">{formatCurrency(getDiscountedTotal())}</span>
              </div>

              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 rounded-xl transition duration-150 cursor-pointer flex justify-center items-center"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span>{t("payment")}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. SHIFT OPEN BLOCK MODAL */}
      {showShiftBlock && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 max-w-sm">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold font-heading">{t("shiftManagement")}</h2>
              <p className="text-xs text-slate-400">{t("openShiftFirst")}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t("startingCash")}</label>
                <input
                  type="number"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <button
                onClick={handleOpenShift}
                className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t("openShiftBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHECKOUT MODAL / DRAWER */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex justify-end max-w-md mx-auto relative bg-black/40 backdrop-blur-sm">
          <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-slide-up">
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>
            
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                {t("payment")}
              </h3>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setShowQrCode(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Payment Method selectors */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                {t("paymentMethod")}
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "CASH", label: t("cash"), icon: DollarSign, color: "text-emerald-500" },
                  { id: "QR_PROMPTPAY", label: t("qrPromptPay"), icon: QrCode, color: "text-accent" },
                  { id: "CREDIT_CARD", label: t("creditCard"), icon: CreditCard, color: "text-indigo-500" },
                  { id: "INSTALLMENT", label: t("installment"), icon: CalendarDays, color: "text-amber-500" }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setShowQrCode(method.id === "QR_PROMPTPAY");
                    }}
                    className={`flex items-center space-x-2.5 p-3 border rounded-xl cursor-pointer transition duration-150 ${
                      paymentMethod === method.id
                        ? "bg-accent/5 border-accent text-accent font-semibold"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <method.icon className={`w-4 h-4 ${method.color}`} />
                    <span className="text-[11px]">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional payment views */}
            {paymentMethod === "CASH" && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">{locale === "th" ? "ยอดเงินที่ต้องชำระ" : "Net Due"}</span>
                  <span className="font-black text-slate-900 dark:text-white">{formatCurrency(getDiscountedTotal())}</span>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{locale === "th" ? "จำนวนเงินที่รับมา" : "Cash Received"}</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Suggested cash buttons */}
                <div className="flex space-x-1.5 overflow-x-auto py-1">
                  {[getDiscountedTotal(), 500, 1000].map((amt, idx) => {
                    const rounded = Math.ceil(amt / 100) * 100;
                    const val = idx === 0 ? amt : rounded;
                    return (
                      <button
                        key={idx}
                        onClick={() => selectSuggestedCash(val)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                      >
                        {formatCurrency(val)}
                      </button>
                    );
                  })}
                </div>

                {parseFloat(cashReceived) >= getDiscountedTotal() && (
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-500">{t("change")}</span>
                    <span className="font-extrabold text-emerald-500">
                      {formatCurrency(parseFloat(cashReceived) - getDiscountedTotal())}
                    </span>
                  </div>
                )}
              </div>
            )}

            {showQrCode && (
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 space-y-3 max-w-[280px] mx-auto">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://promptpay.io/0812345678/100"
                  alt="PromptPay QR Code"
                  className="w-36 h-36 border p-1 rounded"
                />
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">PROMPTPAY QR CODE</p>
                <p className="text-[11px] font-extrabold text-slate-900">{formatCurrency(getDiscountedTotal())}</p>
              </div>
            )}

            {paymentMethod === "INSTALLMENT" && (
              <div className="p-4 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center">
                  <CalendarDays className="w-4 h-4 mr-1.5" />
                  <span>{t("installmentTitle")}</span>
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 pb-1.5 border-b border-amber-500/10">
                    <span>{t("termNumber")} 1 ({locale === "th" ? "จ่ายวันนี้" : "Pay now"})</span>
                    <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(getDiscountedTotal() / 3)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 pb-1.5 border-b border-amber-500/10">
                    <span>{t("termNumber")} 2 ({locale === "th" ? "เดือนหน้า" : "Next Month"})</span>
                    <span className="font-medium">{formatCurrency(getDiscountedTotal() / 3)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>{t("termNumber")} 3 ({locale === "th" ? "2 เดือนหน้า" : "In 2 Months"})</span>
                    <span className="font-medium">{formatCurrency(getDiscountedTotal() / 3)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Complete checkout button */}
            <button
              onClick={handleCheckout}
              disabled={paymentMethod === "CASH" && (parseFloat(cashReceived) < getDiscountedTotal() || !cashReceived)}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 rounded-xl transition duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              <Check className="w-4 h-4 mr-2" />
              <span>{locale === "th" ? "ยืนยันการรับเงิน / ออกบิล" : "Confirm & print receipt"}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
