import { NextRequest, NextResponse } from "next/server";

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

    if (
      !body.serviceId ||
      !body.serviceName ||
      !body.date ||
      !body.time ||
      !body.name ||
      !body.phone
    ) {
      return NextResponse.json(
        { error: "Missing required booking fields." },
        { status: 400 },
      );
    }

    const bookingRecord = {
      id: crypto.randomUUID(),
      serviceId: body.serviceId,
      serviceName: body.serviceName,
      price: body.price ?? null,
      date: body.date,
      time: body.time,
      name: body.name,
      phone: body.phone,
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
      paymentMethod: "cash_on_site",
      status: "confirmed_mock",
    };

    // TODO: Save bookingRecord to the database.
    // Example target: Prisma / Supabase / Neon / PostgreSQL.

    // TODO: Send SMS notification to the salon owner via Twilio.
    // TODO: Send confirmation SMS to the client via Twilio.

    return NextResponse.json({
      success: true,
      booking: bookingRecord,
    });
  } catch (error) {
    console.error("Booking API error:", error);

    return NextResponse.json(
      { error: "Unexpected server error while creating booking." },
      { status: 500 },
    );
  }
}
