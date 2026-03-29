"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import {
  adminUsers,
  bookings,
  services,
  type BookingStatus,
} from "@/db/schema";
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

function slugifyServiceId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function parseIntegerField(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

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
  revalidatePath("/admin/rezerwacje");
}

export async function updateServiceAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const rawServiceId = formData.get("serviceId");
  const rawName = formData.get("name");
  const rawDescription = formData.get("description");
  const serviceId = typeof rawServiceId === "string" ? rawServiceId : "";
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";
  const price = parseIntegerField(formData.get("price"));
  const duration = parseIntegerField(formData.get("duration"));
  const sortOrder = parseIntegerField(formData.get("sortOrder")) ?? 0;
  const isFixedPrice = formData.get("isFixedPrice") === "on";
  const isActive = formData.get("isActive") === "on";

  if (!serviceId || !name || !description || price === null || duration === null) {
    return;
  }

  const db = getDb();
  await db
    .update(services)
    .set({
      name,
      description,
      price,
      duration,
      sortOrder,
      isFixedPrice,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(services.id, serviceId));

  revalidatePath("/admin");
  revalidatePath("/admin/uslugi");
  revalidatePath("/");
}

export async function createServiceAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const rawCustomId = formData.get("newServiceId");
  const rawName = formData.get("name");
  const rawDescription = formData.get("description");
  const customId = typeof rawCustomId === "string" ? rawCustomId : "";
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";
  const price = parseIntegerField(formData.get("price"));
  const duration = parseIntegerField(formData.get("duration"));
  const sortOrder = parseIntegerField(formData.get("sortOrder")) ?? 0;
  const isFixedPrice = formData.get("isFixedPrice") === "on";
  const isActive = formData.get("isActive") === "on";
  const serviceId = slugifyServiceId(customId || name);

  if (!serviceId || !name || !description || price === null || duration === null) {
    return;
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: services.id })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (existing) {
    return;
  }

  await db.insert(services).values({
    id: serviceId,
    name,
    description,
    price,
    duration,
    sortOrder,
    isFixedPrice,
    isActive,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/uslugi");
  revalidatePath("/admin/rezerwacje");
  revalidatePath("/");
}

export async function deleteServiceAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const rawServiceId = formData.get("serviceId");
  const serviceId = typeof rawServiceId === "string" ? rawServiceId : "";

  if (!serviceId) {
    return;
  }

  const db = getDb();
  await db.delete(services).where(eq(services.id, serviceId));

  revalidatePath("/admin");
  revalidatePath("/admin/uslugi");
  revalidatePath("/admin/rezerwacje");
  revalidatePath("/");
}
