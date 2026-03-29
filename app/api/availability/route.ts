import { NextResponse } from "next/server";

import { getAvailabilityMap } from "@/lib/availability";

export async function GET() {
  try {
    const availability = await getAvailabilityMap();

    return NextResponse.json({
      availability,
    });
  } catch (error) {
    console.error("Availability API error:", error);

    return NextResponse.json(
      {
        error: "Nie udało się pobrać dostępności kalendarza.",
      },
      {
        status: 500,
      },
    );
  }
}
