import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { services } from "@/db/schema";

import { ServicesManager } from "./services-manager";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const db = getDb();
  const serviceRows = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      price: services.price,
      duration: services.duration,
      sortOrder: services.sortOrder,
      isFixedPrice: services.isFixedPrice,
      isActive: services.isActive,
    })
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name));

  const activeServicesCount = serviceRows.filter((row) => row.isActive).length;
  const hiddenServicesCount = serviceRows.length - activeServicesCount;
  const fixedPriceServicesCount = serviceRows.filter(
    (row) => row.isFixedPrice,
  ).length;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-[#ead8c6] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Wszystkie usługi
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {serviceRows.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Aktywne
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {activeServicesCount}
          </p>
        </div>
        <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Ukryte
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {hiddenServicesCount}
          </p>
        </div>
        <div className="rounded-[24px] border border-[#ead8c6] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Ze stałą ceną
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {fixedPriceServicesCount}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#ead8c6] bg-white shadow-[0_18px_50px_rgba(166,130,95,0.12)]">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b4a]">
            Usługi
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            Oferta i konfiguracja
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Edytujesz tu nazwy, opisy, ceny, czas trwania, widoczność i kolejność
            usług. Panel pokazuje też status zapisu, błędy i postęp akcji.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <ServicesManager services={serviceRows} />
        </div>
      </div>
    </section>
  );
}
