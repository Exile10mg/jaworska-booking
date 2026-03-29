"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { adminUsers, bookings, type BookingStatus } from "@/db/schema";
import {
  clearAdminSession,
  createAdminSession,
} from "@/lib/admin-session";
import { requireAuthenticatedAdmin } from "@/lib/admin-auth";

const allowedBookingStatuses = new Set<BookingStatus>([
  "pending",
  "confirmed",
  "cancelled",
]);

export async function loginAdminAction(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!process.env.ADMIN_SESSION_SECRET) {
    return {
      error: "Brak konfiguracji sekretu sesji admina.",
    };
  }

  if (!email || !password) {
    return {
      error: "Podaj adres e-mail i hasło.",
    };
  }

  const db = getDb();
  const [admin] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      passwordHash: adminUsers.passwordHash,
    })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (!admin) {
    return {
      error: "Nieprawidłowy e-mail lub hasło.",
    };
  }

  const passwordMatches = await compare(password, admin.passwordHash);

  if (!passwordMatches) {
    return {
      error: "Nieprawidłowy e-mail lub hasło.",
    };
  }

  await createAdminSession({
    adminId: admin.id,
    email: admin.email,
  });

  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function updateBookingStatusAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const rawBookingId = formData.get("bookingId");
  const rawStatus = formData.get("status");
  const bookingId = typeof rawBookingId === "string" ? rawBookingId : "";
  const status = typeof rawStatus === "string" ? rawStatus : "";

  if (!bookingId || !allowedBookingStatuses.has(status as BookingStatus)) {
    return;
  }

  const db = getDb();
  await db
    .update(bookings)
    .set({ status: status as BookingStatus })
    .where(eq(bookings.id, bookingId));

  revalidatePath("/admin");
}
