// lib/db/seed-orders.ts — Add demo orders + order items to Neon
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding orders...");

  // Get tenant
  const [tenant] = await db.select().from(schema.tenants).limit(1);
  console.log(`Tenant: ${tenant.name}`);

  const allBranches = await db.select().from(schema.branches).where(eq(schema.branches.tenantId, tenant.id));
  const allUsers = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenant.id));
  const allProducts = await db.select().from(schema.products).where(eq(schema.products.tenantId, tenant.id));
  const allCustomers = await db.select().from(schema.customers).where(eq(schema.customers.tenantId, tenant.id));

  const sellers = allUsers.filter(u => u.role === "SELLER" || u.role === "MANAGER");

  // Generate orders for the last 30 days
  const now = new Date();
  const ordersData: schema.Order[] = [];
  let orderCounter = 1;

  const paymentMethods: schema.Order["paymentMethod"][] = ["CASH", "QR_PROMPTPAY", "CREDIT_CARD", "CASH", "QR_PROMPTPAY"];

  // Create 25 realistic orders spread over last 30 days
  const orderDefs = [
    { daysAgo: 0, branchIdx: 0, sellerIdx: 0, custIdx: 0, items: [{ pIdx: 0, qty: 1 }, { pIdx: 3, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 0, branchIdx: 0, sellerIdx: 1, custIdx: 1, items: [{ pIdx: 6, qty: 2 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 1, branchIdx: 1, sellerIdx: 2, custIdx: 2, items: [{ pIdx: 1, qty: 1 }, { pIdx: 4, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 1, branchIdx: 0, sellerIdx: 0, custIdx: null, items: [{ pIdx: 7, qty: 1 }, { pIdx: 9, qty: 1 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 2, branchIdx: 2, sellerIdx: 3, custIdx: 4, items: [{ pIdx: 8, qty: 1 }], payment: "CREDIT_CARD" as const },
    { daysAgo: 2, branchIdx: 1, sellerIdx: 2, custIdx: 3, items: [{ pIdx: 2, qty: 1 }, { pIdx: 5, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 3, branchIdx: 0, sellerIdx: 1, custIdx: 0, items: [{ pIdx: 4, qty: 1 }, { pIdx: 9, qty: 2 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 4, branchIdx: 0, sellerIdx: 0, custIdx: 1, items: [{ pIdx: 0, qty: 1 }, { pIdx: 5, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 5, branchIdx: 1, sellerIdx: 2, custIdx: 2, items: [{ pIdx: 6, qty: 3 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 5, branchIdx: 2, sellerIdx: 3, custIdx: null, items: [{ pIdx: 3, qty: 1 }, { pIdx: 1, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 7, branchIdx: 0, sellerIdx: 0, custIdx: 4, items: [{ pIdx: 8, qty: 1 }, { pIdx: 9, qty: 1 }], payment: "CREDIT_CARD" as const },
    { daysAgo: 7, branchIdx: 1, sellerIdx: 2, custIdx: 3, items: [{ pIdx: 2, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 8, branchIdx: 0, sellerIdx: 1, custIdx: 0, items: [{ pIdx: 7, qty: 2 }, { pIdx: 9, qty: 1 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 10, branchIdx: 2, sellerIdx: 3, custIdx: 1, items: [{ pIdx: 1, qty: 1 }, { pIdx: 3, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 12, branchIdx: 0, sellerIdx: 0, custIdx: 2, items: [{ pIdx: 0, qty: 1 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 13, branchIdx: 1, sellerIdx: 2, custIdx: null, items: [{ pIdx: 4, qty: 1 }, { pIdx: 9, qty: 2 }], payment: "CASH" as const },
    { daysAgo: 14, branchIdx: 0, sellerIdx: 1, custIdx: 4, items: [{ pIdx: 5, qty: 1 }, { pIdx: 6, qty: 1 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 15, branchIdx: 2, sellerIdx: 3, custIdx: 3, items: [{ pIdx: 8, qty: 1 }], payment: "INSTALLMENT" as const },
    { daysAgo: 17, branchIdx: 0, sellerIdx: 0, custIdx: 0, items: [{ pIdx: 2, qty: 1 }, { pIdx: 7, qty: 1 }], payment: "CREDIT_CARD" as const },
    { daysAgo: 20, branchIdx: 1, sellerIdx: 2, custIdx: 1, items: [{ pIdx: 3, qty: 1 }, { pIdx: 4, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 21, branchIdx: 0, sellerIdx: 1, custIdx: null, items: [{ pIdx: 6, qty: 2 }, { pIdx: 9, qty: 1 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 23, branchIdx: 2, sellerIdx: 3, custIdx: 2, items: [{ pIdx: 0, qty: 1 }, { pIdx: 5, qty: 1 }], payment: "CASH" as const },
    { daysAgo: 25, branchIdx: 0, sellerIdx: 0, custIdx: 4, items: [{ pIdx: 1, qty: 1 }], payment: "QR_PROMPTPAY" as const },
    { daysAgo: 28, branchIdx: 1, sellerIdx: 2, custIdx: 3, items: [{ pIdx: 8, qty: 1 }, { pIdx: 9, qty: 3 }], payment: "CASH" as const },
    { daysAgo: 30, branchIdx: 0, sellerIdx: 0, custIdx: 0, items: [{ pIdx: 2, qty: 1 }, { pIdx: 3, qty: 1 }], payment: "CASH" as const },
  ];

  let totalOrders = 0;
  let totalItems = 0;

  for (const def of orderDefs) {
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - def.daysAgo);
    orderDate.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

    const branch = allBranches[def.branchIdx % allBranches.length];
    const seller = sellers[def.sellerIdx % sellers.length];
    const customer = def.custIdx !== null ? allCustomers[def.custIdx % allCustomers.length] : null;

    // Calculate totals
    const items = def.items.map(item => {
      const product = allProducts[item.pIdx % allProducts.length];
      return { product, quantity: item.qty, price: product.price, discount: 0 };
    });

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount = 0;
    const netAmount = totalAmount - discountAmount;

    const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `EF-${dateStr}-${String(orderCounter++).padStart(4, "0")}`;

    // Insert order
    const [order] = await db.insert(schema.orders).values({
      tenantId: tenant.id,
      orderNumber,
      customerId: customer?.id ?? null,
      sellerId: seller.id,
      branchId: branch.id,
      totalAmount,
      discountAmount,
      netAmount,
      paidAmount: netAmount,
      paymentMethod: def.payment,
      status: "PAID",
      isETaxRequested: Math.random() > 0.7,
      createdAt: orderDate,
      updatedAt: orderDate,
    }).returning();

    // Insert order items
    await db.insert(schema.orderItems).values(
      items.map(i => ({
        tenantId: tenant.id,
        orderId: order.id,
        productId: i.product.id,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount,
      }))
    );

    totalOrders++;
    totalItems += items.length;
    process.stdout.write(`  Order ${order.orderNumber} = ฿${netAmount.toLocaleString()}\n`);
  }

  // Add audit logs for orders
  await db.insert(schema.auditLogs).values(
    orderDefs.slice(0, 5).map((def, i) => ({
      tenantId: tenant.id,
      userId: sellers[def.sellerIdx % sellers.length].id,
      userName: sellers[def.sellerIdx % sellers.length].name,
      action: "ORDER_CREATED" as const,
      target: `EF-${String(i + 1)}`,
      detail: `สร้างออเดอร์ใหม่`,
    }))
  );

  console.log(`\n✅ Created ${totalOrders} orders + ${totalItems} items`);
  console.log(`🎉 Seed-orders completed!`);
}

main().catch(console.error);
