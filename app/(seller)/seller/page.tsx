// app/(seller)/seller/page.tsx
import { redirect } from "next/navigation";

export default function SellerRootPage() {
  redirect("/seller/dashboard");
}
