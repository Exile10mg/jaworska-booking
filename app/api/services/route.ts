import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { services } from "@/db/schema";
import { defaultServices } from "@/lib/default-services";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        price: services.price,
        duration: services.duration,
        isFixedPrice: services.isFixedPrice,
      })
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.sortOrder), asc(services.name));

    if (rows.length === 0) {
      return NextResponse.json({
        services: defaultServices.map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          isFixedPrice: service.isFixedPrice ?? false,
        })),
      });
    }

    return NextResponse.json({
      services: rows,
    });
  } catch (error) {
    console.error("Services API error:", error);

    return NextResponse.json({
      services: defaultServices.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        isFixedPrice: service.isFixedPrice ?? false,
      })),
    });
  }
}
