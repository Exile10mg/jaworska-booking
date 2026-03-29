import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { bookings } from "@/db/schema";
import {
  isSlotCurrentlyAvailable,
  normalizeDateKey,
  normalizeTimeValue,
} from "@/lib/availability";

type BookingPayload = {
  serviceId?: string;
  serviceName?: string;
  price?: number;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingPayload;
    const normalizedName = body.name?.trim() ?? "";
    const normalizedPhone = body.phone?.trim() ?? "";
    const normalizedNotes = body.notes?.trim() ?? "";
    const normalizedDate =
      typeof body.date === "string" ? normalizeDateKey(body.date) : null;
    const normalizedTime =
      typeof body.time === "string" ? normalizeTimeValue(body.time) : null;

    if (
      !body.serviceId ||
      !body.serviceName ||
      !normalizedDate ||
      !normalizedTime ||
      !normalizedName ||
      !normalizedPhone
    ) {
      return NextResponse.json(
        { error: "Brakuje wymaganych danych rezerwacji." },
        { status: 400 },
      );
    }

    const isAvailable = await isSlotCurrentlyAvailable(
      normalizedDate,
      normalizedTime,
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: "Wybrany termin nie jest już dostępny." },
        { status: 409 },
      );
    }

    const db = getDb();
    const [bookingRecord] = await db
      .insert(bookings)
      .values({
        serviceId: body.serviceId,
        serviceName: body.serviceName.trim(),
        price: Number.isFinite(body.price) ? body.price : null,
        appointmentDate: normalizedDate,
        appointmentTime: normalizedTime,
        customerName: normalizedName,
        customerPhone: normalizedPhone,
        notes: normalizedNotes,
        status: "pending",
        paymentMethod: "cash_on_site",
      })
      .returning({
        id: bookings.id,
        serviceId: bookings.serviceId,
        serviceName: bookings.serviceName,
        price: bookings.price,
        date: bookings.appointmentDate,
        time: bookings.appointmentTime,
        name: bookings.customerName,
        phone: bookings.customerPhone,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        paymentMethod: bookings.paymentMethod,
        status: bookings.status,
      });

    return NextResponse.json(
      {
        success: true,
        booking: bookingRecord,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Booking API error:", error);

    const isMissingDatabaseUrl =
      error instanceof Error && error.message === "DATABASE_URL is not set.";

    return NextResponse.json(
      {
        error: isMissingDatabaseUrl
          ? "Brak konfiguracji połączenia z bazą danych."
          : "Wystąpił błąd podczas zapisywania rezerwacji.",
      },
      {
        status: 500,
      },
    );
  }
}
