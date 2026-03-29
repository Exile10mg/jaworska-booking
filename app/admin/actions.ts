"use server";

import { compare } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type AdminActionState } from "@/app/admin/action-state";
import { getDb } from "@/db/client";
import {
  adminUsers,
  availabilitySlots,
  bookings,
  services,
  type BookingStatus,
} from "@/db/schema";
import {
  clearAdminSession,
  createAdminSession,
} from "@/lib/admin-session";
import { requireAuthenticatedAdmin } from "@/lib/admin-auth";
import {
  buildSlotsFromRange,
  isFutureSlot,
  normalizeDateKey,
  normalizeTimeValue,
} from "@/lib/availability";

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

function validateServiceFields({
  serviceId,
  name,
  description,
  price,
  duration,
}: {
  serviceId: string;
  name: string;
  description: string;
  price: number | null;
  duration: number | null;
}): string | null {
  if (!serviceId) {
    return "Brak identyfikatora usługi.";
  }

  if (!name) {
    return "Podaj nazwę usługi.";
  }

  if (!description) {
    return "Dodaj krótki opis usługi.";
  }

  if (price === null || price < 0) {
    return "Cena musi być liczbą równą lub większą od 0.";
  }

  if (duration === null || duration <= 0) {
    return "Czas trwania musi być liczbą minut większą od 0.";
  }

  return null;
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
  const [currentBooking] = await db
    .select({
      id: bookings.id,
      appointmentDate: bookings.appointmentDate,
      appointmentTime: bookings.appointmentTime,
      status: bookings.status,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!currentBooking) {
    return;
  }

  await db
    .update(bookings)
    .set({ status: status as BookingStatus })
    .where(eq(bookings.id, bookingId));

  const shouldTouchAvailability = isFutureSlot(
    currentBooking.appointmentDate,
    currentBooking.appointmentTime,
  );

  if (shouldTouchAvailability) {
    const isTransitionToCancelled =
      currentBooking.status !== "cancelled" && status === "cancelled";
    const isTransitionFromCancelled =
      currentBooking.status === "cancelled" && status !== "cancelled";

    if (isTransitionToCancelled) {
      await db
        .insert(availabilitySlots)
        .values({
          slotDate: currentBooking.appointmentDate,
          slotTime: currentBooking.appointmentTime,
        })
        .onConflictDoNothing();
    }

    if (isTransitionFromCancelled) {
      await db
        .delete(availabilitySlots)
        .where(
          and(
            eq(availabilitySlots.slotDate, currentBooking.appointmentDate),
            eq(availabilitySlots.slotTime, currentBooking.appointmentTime),
          ),
        );
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/rezerwacje");
  revalidatePath("/admin/terminarz");
  revalidatePath("/");
}

export async function deleteBookingAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAuthenticatedAdmin();

  const rawBookingId = formData.get("bookingId");
  const bookingId = typeof rawBookingId === "string" ? rawBookingId : "";

  if (!bookingId) {
    return {
      status: "error",
      message: "Nie znaleziono rezerwacji do usunięcia.",
    };
  }

  try {
    const db = getDb();
    const [deletedBooking] = await db
      .delete(bookings)
      .where(eq(bookings.id, bookingId))
      .returning({
        id: bookings.id,
        appointmentDate: bookings.appointmentDate,
        appointmentTime: bookings.appointmentTime,
      });

    if (!deletedBooking) {
      return {
        status: "error",
        message: "Ta rezerwacja nie istnieje albo została już usunięta.",
      };
    }

    if (
      isFutureSlot(
        deletedBooking.appointmentDate,
        deletedBooking.appointmentTime,
      )
    ) {
      await db
        .insert(availabilitySlots)
        .values({
          slotDate: deletedBooking.appointmentDate,
          slotTime: deletedBooking.appointmentTime,
        })
        .onConflictDoNothing();
    }

    revalidatePath("/admin");
    revalidatePath("/admin/rezerwacje");
    revalidatePath("/admin/terminarz");
    revalidatePath("/");

    return {
      status: "success",
      message: "Rezerwacja została usunięta.",
    };
  } catch (error) {
    console.error("Delete booking action error:", error);

    return {
      status: "error",
      message: "Nie udało się usunąć rezerwacji. Spróbuj ponownie.",
    };
  }
}

export async function updateServiceAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
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

  const validationError = validateServiceFields({
    serviceId,
    name,
    description,
    price,
    duration,
  });

  if (validationError) {
    return {
      status: "error",
      message: validationError,
    };
  }

  const validatedPrice = price as number;
  const validatedDuration = duration as number;

  try {
    const db = getDb();
    await db
      .update(services)
      .set({
        name,
        description,
        price: validatedPrice,
        duration: validatedDuration,
        sortOrder,
        isFixedPrice,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId));

    revalidatePath("/admin");
    revalidatePath("/admin/uslugi");
    revalidatePath("/");

    return {
      status: "success",
      message: "Zmiany w usłudze zostały zapisane.",
    };
  } catch (error) {
    console.error("Update service action error:", error);

    return {
      status: "error",
      message: "Nie udało się zapisać zmian. Spróbuj ponownie.",
    };
  }
}

export async function createServiceAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
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

  const validationError = validateServiceFields({
    serviceId,
    name,
    description,
    price,
    duration,
  });

  if (validationError) {
    return {
      status: "error",
      message: validationError,
    };
  }

  const validatedPrice = price as number;
  const validatedDuration = duration as number;

  try {
    const db = getDb();
    const [existing] = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (existing) {
      return {
        status: "error",
        message:
          "Usługa o takim ID już istnieje. Zmień ID techniczne lub nazwę.",
      };
    }

    await db.insert(services).values({
      id: serviceId,
      name,
      description,
      price: validatedPrice,
      duration: validatedDuration,
      sortOrder,
      isFixedPrice,
      isActive,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/uslugi");
    revalidatePath("/admin/rezerwacje");
    revalidatePath("/");

    return {
      status: "success",
      message: "Nowa usługa została dodana.",
    };
  } catch (error) {
    console.error("Create service action error:", error);

    return {
      status: "error",
      message: "Nie udało się dodać usługi. Spróbuj ponownie.",
    };
  }
}

export async function deleteServiceAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAuthenticatedAdmin();

  const rawServiceId = formData.get("serviceId");
  const serviceId = typeof rawServiceId === "string" ? rawServiceId : "";

  if (!serviceId) {
    return {
      status: "error",
      message: "Nie znaleziono usługi do usunięcia.",
    };
  }

  try {
    const db = getDb();
    await db.delete(services).where(eq(services.id, serviceId));

    revalidatePath("/admin");
    revalidatePath("/admin/uslugi");
    revalidatePath("/admin/rezerwacje");
    revalidatePath("/");

    return {
      status: "success",
      message: "Usługa została usunięta.",
    };
  } catch (error) {
    console.error("Delete service action error:", error);

    return {
      status: "error",
      message: "Nie udało się usunąć usługi. Spróbuj ponownie.",
    };
  }
}

export async function createAvailabilityWindowAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAuthenticatedAdmin();

  const rawDate = formData.get("date");
  const rawStartTime = formData.get("startTime");
  const rawEndTime = formData.get("endTime");
  const date =
    typeof rawDate === "string" ? normalizeDateKey(rawDate) : null;
  const startTime =
    typeof rawStartTime === "string" ? normalizeTimeValue(rawStartTime) : null;
  const endTime =
    typeof rawEndTime === "string" ? normalizeTimeValue(rawEndTime) : null;
  const intervalMinutes = parseIntegerField(formData.get("intervalMinutes"));

  if (!date) {
    return {
      status: "error",
      message: "Wybierz datę dostępności.",
    };
  }

  if (!startTime || !endTime) {
    return {
      status: "error",
      message: "Podaj poprawną godzinę rozpoczęcia i zakończenia.",
    };
  }

  if (!intervalMinutes || intervalMinutes <= 0) {
    return {
      status: "error",
      message: "Interwał musi być liczbą minut większą od 0.",
    };
  }

  const slots = buildSlotsFromRange(startTime, endTime, intervalMinutes);

  if (slots.length === 0) {
    return {
      status: "error",
      message: "Zakres godzin jest nieprawidłowy.",
    };
  }

  try {
    const db = getDb();
    await db
      .insert(availabilitySlots)
      .values(
        slots.map((slotTime) => ({
          slotDate: date,
          slotTime,
        })),
      )
      .onConflictDoNothing();

    revalidatePath("/admin");
    revalidatePath("/admin/terminarz");
    revalidatePath("/");

    return {
      status: "success",
      message: `Dodano ${slots.length} slot${slots.length === 1 ? "" : slots.length < 5 ? "y" : "ów"} dla dnia ${date}.`,
    };
  } catch (error) {
    console.error("Create availability window action error:", error);

    return {
      status: "error",
      message: "Nie udało się dodać dostępności. Spróbuj ponownie.",
    };
  }
}

export async function deleteAvailabilitySlotAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAuthenticatedAdmin();

  const rawDate = formData.get("date");
  const rawTime = formData.get("time");
  const date =
    typeof rawDate === "string" ? normalizeDateKey(rawDate) : null;
  const time =
    typeof rawTime === "string" ? normalizeTimeValue(rawTime) : null;

  if (!date || !time) {
    return {
      status: "error",
      message: "Nie znaleziono slotu do usunięcia.",
    };
  }

  try {
    const db = getDb();
    await db
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.slotDate, date),
          eq(availabilitySlots.slotTime, time),
        ),
      );

    revalidatePath("/admin");
    revalidatePath("/admin/terminarz");
    revalidatePath("/");

    return {
      status: "success",
      message: `Usunięto slot ${time} z dnia ${date}.`,
    };
  } catch (error) {
    console.error("Delete availability slot action error:", error);

    return {
      status: "error",
      message: "Nie udało się usunąć slotu. Spróbuj ponownie.",
    };
  }
}

export async function deleteAvailabilityDayAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAuthenticatedAdmin();

  const rawDate = formData.get("date");
  const date =
    typeof rawDate === "string" ? normalizeDateKey(rawDate) : null;

  if (!date) {
    return {
      status: "error",
      message: "Nie znaleziono dnia do usunięcia.",
    };
  }

  try {
    const db = getDb();
    await db.delete(availabilitySlots).where(eq(availabilitySlots.slotDate, date));

    revalidatePath("/admin");
    revalidatePath("/admin/terminarz");
    revalidatePath("/");

    return {
      status: "success",
      message: `Usunięto wszystkie sloty z dnia ${date}.`,
    };
  } catch (error) {
    console.error("Delete availability day action error:", error);

    return {
      status: "error",
      message: "Nie udało się usunąć dnia z terminarza.",
    };
  }
}
