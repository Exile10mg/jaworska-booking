import { asc } from "drizzle-orm";

import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/app/admin/actions";
import { getDb } from "@/db/client";
import { services } from "@/db/schema";

export const dynamic = "force-dynamic";

function ServiceEditorCard({
  service,
}: {
  service: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    sortOrder: number;
    isFixedPrice: boolean;
    isActive: boolean;
  };
}) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,_#fffdfa,_#fff8f2)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            ID usługi
          </p>
          <p className="mt-1 font-mono text-sm text-stone-900">{service.id}</p>
        </div>

        <form action={deleteServiceAction}>
          <input type="hidden" name="serviceId" value={service.id} />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Usuń usługę
          </button>
        </form>
      </div>

      <form action={updateServiceAction} className="mt-4 grid gap-4">
        <input type="hidden" name="serviceId" value={service.id} />

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Nagłówek / nazwa usługi
          </label>
          <input
            name="name"
            type="text"
            defaultValue={service.name}
            className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Opis
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={service.description}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Cena
            </label>
            <input
              name="price"
              type="number"
              min="0"
              defaultValue={service.price}
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Czas trwania (min)
            </label>
            <input
              name="duration"
              type="number"
              min="5"
              step="5"
              defaultValue={service.duration}
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Kolejność
            </label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={service.sortOrder}
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <input
              name="isFixedPrice"
              type="checkbox"
              defaultChecked={service.isFixedPrice}
              className="h-4 w-4 accent-[#8c6b4a]"
            />
            Stała cena
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={service.isActive}
              className="h-4 w-4 accent-[#8c6b4a]"
            />
            Aktywna w formularzu rezerwacji
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Zapisz zmiany
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateServiceCard() {
  return (
    <form
      action={createServiceAction}
      className="rounded-[24px] border border-dashed border-[#d9c0a7] bg-[#fffaf5] p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c6b4a]">
            Nowa usługa
          </p>
          <h3 className="mt-1 text-lg font-semibold text-stone-900">
            Dodaj pozycję do oferty
          </h3>
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-black"
        >
          Dodaj usługę
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Nagłówek / nazwa usługi
            </label>
            <input
              name="name"
              type="text"
              placeholder="Np. Henna pudrowa + regulacja"
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              ID techniczne
            </label>
            <input
              name="newServiceId"
              type="text"
              placeholder="Opcjonalnie, np. henna-pudrowa"
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Opis
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Krótki opis usługi widoczny w formularzu rezerwacji."
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Cena
            </label>
            <input
              name="price"
              type="number"
              min="0"
              placeholder="0"
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Czas trwania (min)
            </label>
            <input
              name="duration"
              type="number"
              min="5"
              step="5"
              placeholder="30"
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Kolejność
            </label>
            <input
              name="sortOrder"
              type="number"
              defaultValue="999"
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <input
              name="isFixedPrice"
              type="checkbox"
              className="h-4 w-4 accent-[#8c6b4a]"
            />
            Stała cena
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-[#8c6b4a]"
            />
            Aktywna w formularzu rezerwacji
          </label>
        </div>
      </div>
    </form>
  );
}

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
  const fixedPriceServicesCount = serviceRows.filter(
    (row) => row.isFixedPrice,
  ).length;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
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
            Tutaj edytujesz nagłówki, opisy, ceny, czas trwania, widoczność i możesz usuwać usługi.
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <CreateServiceCard />

          {serviceRows.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-5 py-10 text-center text-sm text-stone-500">
              Brak usług w bazie.
            </div>
          ) : (
            serviceRows.map((service) => (
              <ServiceEditorCard key={service.id} service={service} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
