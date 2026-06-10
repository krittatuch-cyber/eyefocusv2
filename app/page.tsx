// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role === "OWNER" || parsedUser.role === "MANAGER") {
        router.push("/seller/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
