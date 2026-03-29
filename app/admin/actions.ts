"use server";

import { compare } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { type AdminActionState } from "@/app/admin/action-state";
import { getDb } from "@/db/client";
import {
  adminLoginAttempts,
  adminUsers,
  availabilitySlots,
  bookings,
  legalDocuments,
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
import {
  cancelScheduledBookingReminderSms,
  sendBookingCancelledSms,
  sendBookingConfirmedSms,
  sendBookingDeletedSms,
  sendBookingRescheduledSms,
  scheduleBookingReminderSms,
} from "@/lib/sms-notifications";
import {
  legalDocumentKeys,
  type LegalDocumentKey,
} from "@/lib/default-legal-documents";

const allowedBookingStatuses = new Set<BookingStatus>([
  "pending",
  "confirmed",
  "cancelled",
]);
const MAX_ADMIN_LOGIN_ATTEMPTS = 5;
const ADMIN_LOGIN_LOCK_MINUTES = 15;
const DUMMY_PASSWORD_HASH =
  "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiJxYqV1CmvY/fx/n6PvJEa3QgUnIF6";

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

function getClientIpAddress(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");

  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    const normalizedIp = firstIp?.trim();
    if (normalizedIp) return normalizedIp.slice(0, 128);
  }

  if (realIp) {
    return realIp.trim().slice(0, 128);
  }

  return "unknown";
}

async function getAdminLoginAttempt(email: string, ipAddress: string) {
  const db = getDb();
  const [attempt] = await db
    .select({
      id: adminLoginAttempts.id,
      failedAttempts: adminLoginAttempts.failedAttempts,
      lockedUntil: adminLoginAttempts.lockedUntil,
    })
    .from(adminLoginAttempts)
    .where(
      and(
        eq(adminLoginAttempts.email, email),
        eq(adminLoginAttempts.ipAddress, ipAddress),
      ),
    )
    .limit(1);

  return attempt ?? null;
}

async function clearAdminLoginAttempt(email: string, ipAddress: string) {
  const db = getDb();
  await db
    .delete(adminLoginAttempts)
    .where(
      and(
        eq(adminLoginAttempts.email, email),
        eq(adminLoginAttempts.ipAddress, ipAddress),
      ),
    );
}

async function registerFailedAdminLoginAttempt(email: string, ipAddress: string) {
  const db = getDb();
  const now = new Date();
  const currentAttempt = await getAdminLoginAttempt(email, ipAddress);
  const nextFailedAttempts = (currentAttempt?.failedAttempts ?? 0) + 1;
  const lockedUntil =
    nextFailedAttempts >= MAX_ADMIN_LOGIN_ATTEMPTS
      ? new Date(now.getTime() + ADMIN_LOGIN_LOCK_MINUTES * 60 * 1000)
      : null;

  if (!currentAttempt) {
    await db.insert(adminLoginAttempts).values({
      email,
      ipAddress,
      failedAttempts: nextFailedAttempts,
      lockedUntil,
      lastAttemptAt: now,
      updatedAt: now,
    });

    return lockedUntil;
  }

  await db
    .update(adminLoginAttempts)
    .set({
      failedAttempts: nextFailedAttempts,
      lockedUntil,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .where(eq(adminLoginAttempts.id, currentAttempt.id));

  return lockedUntil;
}

function getLockMessage(lockedUntil: Date) {
  const remainingMs = lockedUntil.getTime() - Date.now();
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

  return `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za około ${remainingMinutes} min.`;
}

async function clearBookingReminder({
  bookingId,
  reminderSmsSid,
}: {
  bookingId: string;
  reminderSmsSid?: string | null;
}) {
  if (reminderSmsSid) {
    try {
      await cancelScheduledBookingReminderSms(reminderSmsSid);
    } catch (error) {
      console.error("Cancel booking reminder SMS error:", error);
    }
  }

  const db = getDb();
  await db
    .update(bookings)
    .set({
      reminderSmsSid: null,
      reminderScheduledFor: null,
    })
    .where(eq(bookings.id, bookingId));
}

async function syncConfirmedBookingReminder({
  bookingId,
  serviceName,
  appointmentDate,
  appointmentTime,
  customerName,
  customerPhone,
  price,
  previousReminderSmsSid,
}: {
  bookingId: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  price: number | null;
  previousReminderSmsSid?: string | null;
}) {
  if (previousReminderSmsSid) {
    try {
      await cancelScheduledBookingReminderSms(previousReminderSmsSid);
    } catch (error) {
      console.error("Cancel previous booking reminder SMS error:", error);
    }
  }

  let reminderSmsSid: string | null = null;
  let reminderScheduledFor: Date | null = null;

  try {
    const scheduledReminder = await scheduleBookingReminderSms({
      serviceName,
      appointmentDate,
      appointmentTime,
      customerName,
      customerPhone,
      price,
    });

    if (scheduledReminder) {
      reminderSmsSid = scheduledReminder.sid;
      reminderScheduledFor = scheduledReminder.sendAt;
    }
  } catch (error) {
    console.error("Schedule booking reminder SMS error:", error);
  }

  const db = getDb();
  await db
    .update(bookings)
    .set({
      reminderSmsSid,
      reminderScheduledFor,
    })
    .where(eq(bookings.id, bookingId));
}

export async function loginAdminAction(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const headerStore = await headers();
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const ipAddress = getClientIpAddress(headerStore);

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

  const activeAttempt = await getAdminLoginAttempt(email, ipAddress);

  if (
    activeAttempt?.lockedUntil &&
    activeAttempt.lockedUntil.getTime() > Date.now()
  ) {
    return {
      error: getLockMessage(activeAttempt.lockedUntil),
    };
  }

  if (activeAttempt?.lockedUntil) {
    await clearAdminLoginAttempt(email, ipAddress);
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

  const passwordMatches = admin
    ? await compare(password, admin.passwordHash)
    : await compare(password, DUMMY_PASSWORD_HASH);

  if (!admin || !passwordMatches) {
    const lockedUntil = await registerFailedAdminLoginAttempt(email, ipAddress);

    return {
      error: lockedUntil
        ? getLockMessage(lockedUntil)
        : "Nieprawidłowy e-mail lub hasło.",
    };
  }

  await clearAdminLoginAttempt(email, ipAddress);

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
      serviceName: bookings.serviceName,
      appointmentDate: bookings.appointmentDate,
      appointmentTime: bookings.appointmentTime,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      price: bookings.price,
      status: bookings.status,
      reminderSmsSid: bookings.reminderSmsSid,
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

  if (currentBooking.status !== status) {
    if (currentBooking.status === "confirmed" && status !== "confirmed") {
      await clearBookingReminder({
        bookingId,
        reminderSmsSid: currentBooking.reminderSmsSid,
      });
    }

    try {
      if (status === "confirmed") {
        await sendBookingConfirmedSms({
          serviceName: currentBooking.serviceName,
          appointmentDate: currentBooking.appointmentDate,
          appointmentTime: currentBooking.appointmentTime,
          customerName: currentBooking.customerName,
          customerPhone: currentBooking.customerPhone,
          price: currentBooking.price,
        });

        await syncConfirmedBookingReminder({
          bookingId,
          serviceName: currentBooking.serviceName,
          appointmentDate: currentBooking.appointmentDate,
          appointmentTime: currentBooking.appointmentTime,
          customerName: currentBooking.customerName,
          customerPhone: currentBooking.customerPhone,
          price: currentBooking.price,
          previousReminderSmsSid: currentBooking.reminderSmsSid,
        });
      }

      if (status === "cancelled") {
        await sendBookingCancelledSms({
          serviceName: currentBooking.serviceName,
          appointmentDate: currentBooking.appointmentDate,
          appointmentTime: currentBooking.appointmentTime,
          customerName: currentBooking.customerName,
          customerPhone: currentBooking.customerPhone,
          price: currentBooking.price,
        });
      }
    } catch (notificationError) {
      console.error("Booking status SMS notification error:", notificationError);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/rezerwacje");
  revalidatePath("/admin/terminarz");
  revalidatePath("/");
}

export async function updateBookingDetailsAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAuthenticatedAdmin();

  const rawBookingId = formData.get("bookingId");
  const rawServiceId = formData.get("serviceId");
  const rawCustomerName = formData.get("customerName");
  const rawCustomerPhone = formData.get("customerPhone");
  const rawAppointmentDate = formData.get("appointmentDate");
  const rawAppointmentTime = formData.get("appointmentTime");
  const rawNotes = formData.get("notes");

  const bookingId = typeof rawBookingId === "string" ? rawBookingId : "";
  const serviceId = typeof rawServiceId === "string" ? rawServiceId : "";
  const customerName =
    typeof rawCustomerName === "string" ? rawCustomerName.trim() : "";
  const customerPhone =
    typeof rawCustomerPhone === "string" ? rawCustomerPhone.trim() : "";
  const appointmentDate =
    typeof rawAppointmentDate === "string"
      ? normalizeDateKey(rawAppointmentDate)
      : null;
  const appointmentTime =
    typeof rawAppointmentTime === "string"
      ? normalizeTimeValue(rawAppointmentTime)
      : null;
  const notes = typeof rawNotes === "string" ? rawNotes.trim() : "";

  if (!bookingId) {
    return {
      status: "error",
      message: "Nie znaleziono rezerwacji do edycji.",
    };
  }

  if (!serviceId) {
    return {
      status: "error",
      message: "Wybierz usługę.",
    };
  }

  if (!customerName) {
    return {
      status: "error",
      message: "Podaj imię i nazwisko klientki.",
    };
  }

  if (!customerPhone) {
    return {
      status: "error",
      message: "Podaj numer telefonu klientki.",
    };
  }

  if (!appointmentDate || !appointmentTime) {
    return {
      status: "error",
      message: "Wybierz poprawny termin wizyty.",
    };
  }

  const db = getDb();
  const [currentBooking] = await db
    .select({
      id: bookings.id,
      serviceId: bookings.serviceId,
      serviceName: bookings.serviceName,
      price: bookings.price,
      appointmentDate: bookings.appointmentDate,
      appointmentTime: bookings.appointmentTime,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      notes: bookings.notes,
      status: bookings.status,
      reminderSmsSid: bookings.reminderSmsSid,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!currentBooking) {
    return {
      status: "error",
      message: "Ta rezerwacja już nie istnieje.",
    };
  }

  const [selectedService] = await db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!selectedService) {
    return {
      status: "error",
      message: "Wybrana usługa nie istnieje.",
    };
  }

  const slotChanged =
    currentBooking.appointmentDate !== appointmentDate ||
    currentBooking.appointmentTime !== appointmentTime;
  const reminderPayloadChanged =
    slotChanged ||
    currentBooking.serviceId !== selectedService.id ||
    currentBooking.customerName !== customerName ||
    currentBooking.customerPhone !== customerPhone ||
    currentBooking.price !== selectedService.price;
  const bookingKeepsSlotReserved = currentBooking.status !== "cancelled";
  let reservedNewSlot = false;

  try {
    if (slotChanged && bookingKeepsSlotReserved) {
      const [slotRow] = await db
        .delete(availabilitySlots)
        .where(
          and(
            eq(availabilitySlots.slotDate, appointmentDate),
            eq(availabilitySlots.slotTime, appointmentTime),
          ),
        )
        .returning({ id: availabilitySlots.id });

      if (!slotRow) {
        return {
          status: "error",
          message: "Wybrany termin nie jest już dostępny.",
        };
      }

      reservedNewSlot = true;
    }

    await db
      .update(bookings)
      .set({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        appointmentDate,
        appointmentTime,
        customerName,
        customerPhone,
        notes,
      })
      .where(eq(bookings.id, bookingId));

    if (
      slotChanged &&
      bookingKeepsSlotReserved &&
      isFutureSlot(currentBooking.appointmentDate, currentBooking.appointmentTime)
    ) {
      await db
        .insert(availabilitySlots)
        .values({
          slotDate: currentBooking.appointmentDate,
          slotTime: currentBooking.appointmentTime,
        })
        .onConflictDoNothing();
    }

    if (currentBooking.status === "confirmed" && reminderPayloadChanged) {
      await syncConfirmedBookingReminder({
        bookingId,
        serviceName: selectedService.name,
        appointmentDate,
        appointmentTime,
        customerName,
        customerPhone,
        price: selectedService.price,
        previousReminderSmsSid: currentBooking.reminderSmsSid,
      });
    }

    if (slotChanged && currentBooking.status !== "cancelled") {
      try {
        await sendBookingRescheduledSms({
          serviceName: selectedService.name,
          appointmentDate,
          appointmentTime,
          customerName,
          customerPhone,
          price: selectedService.price,
        });
      } catch (notificationError) {
        console.error("Booking reschedule SMS notification error:", notificationError);
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/rezerwacje");
    revalidatePath("/admin/terminarz");
    revalidatePath("/");

    return {
      status: "success",
      message: "Rezerwacja została zaktualizowana.",
    };
  } catch (error) {
    if (reservedNewSlot) {
      await db
        .insert(availabilitySlots)
        .values({
          slotDate: appointmentDate,
          slotTime: appointmentTime,
        })
        .onConflictDoNothing();
    }

    console.error("Update booking details action error:", error);

    return {
      status: "error",
      message: "Nie udało się zapisać zmian w rezerwacji.",
    };
  }
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
        serviceName: bookings.serviceName,
        appointmentDate: bookings.appointmentDate,
        appointmentTime: bookings.appointmentTime,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        price: bookings.price,
        reminderSmsSid: bookings.reminderSmsSid,
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

    if (deletedBooking.reminderSmsSid) {
      try {
        await cancelScheduledBookingReminderSms(deletedBooking.reminderSmsSid);
      } catch (notificationError) {
        console.error(
          "Booking reminder cancellation on delete error:",
          notificationError,
        );
      }
    }

    try {
      await sendBookingDeletedSms({
        serviceName: deletedBooking.serviceName,
        appointmentDate: deletedBooking.appointmentDate,
        appointmentTime: deletedBooking.appointmentTime,
        customerName: deletedBooking.customerName,
        customerPhone: deletedBooking.customerPhone,
        price: deletedBooking.price,
      });
    } catch (notificationError) {
      console.error("Booking deletion SMS notification error:", notificationError);
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

export async function createAvailabilitySlotAction(
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

  if (!date) {
    return {
      status: "error",
      message: "Wybierz datę dostępności.",
    };
  }

  if (!time) {
    return {
      status: "error",
      message: "Podaj poprawną godzinę slotu.",
    };
  }

  try {
    const db = getDb();
    const insertedSlots = await db
      .insert(availabilitySlots)
      .values({
        slotDate: date,
        slotTime: time,
      })
      .onConflictDoNothing()
      .returning({ id: availabilitySlots.id });

    revalidatePath("/admin");
    revalidatePath("/admin/terminarz");
    revalidatePath("/");

    if (insertedSlots.length === 0) {
      return {
        status: "success",
        message: `Godzina ${time} dla dnia ${date} już jest w terminarzu.`,
      };
    }

    return {
      status: "success",
      message: `Dodano godzinę ${time} dla dnia ${date}.`,
    };
  } catch (error) {
    console.error("Create availability slot action error:", error);

    return {
      status: "error",
      message: "Nie udało się dodać godziny do terminarza. Spróbuj ponownie.",
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

export async function updateLegalDocumentAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAuthenticatedAdmin();

  const rawKey = formData.get("key");
  const rawTitle = formData.get("title");
  const rawContent = formData.get("content");
  const key = typeof rawKey === "string" ? rawKey : "";
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const content = typeof rawContent === "string" ? rawContent.trim() : "";

  if (!legalDocumentKeys.includes(key as LegalDocumentKey)) {
    return {
      status: "error",
      message: "Nie znaleziono dokumentu do zapisania.",
    };
  }

  if (!title) {
    return {
      status: "error",
      message: "Podaj tytuł dokumentu.",
    };
  }

  if (!content) {
    return {
      status: "error",
      message: "Wklej treść dokumentu.",
    };
  }

  try {
    const db = getDb();
    await db
      .insert(legalDocuments)
      .values({
        key,
        title,
        content,
      })
      .onConflictDoUpdate({
        target: legalDocuments.key,
        set: {
          title,
          content,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/admin");
    revalidatePath("/admin/dokumenty");
    revalidatePath("/");

    return {
      status: "success",
      message: "Treść dokumentu została zapisana.",
    };
  } catch (error) {
    console.error("Update legal document action error:", error);

    return {
      status: "error",
      message: "Nie udało się zapisać dokumentu. Spróbuj ponownie.",
    };
  }
}

