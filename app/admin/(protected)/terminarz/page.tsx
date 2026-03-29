import { getAvailabilityDays } from "@/lib/availability";

import { ScheduleManager } from "./schedule-manager";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const days = await getAvailabilityDays();
  const slotCount = days.reduce((total, day) => total + day.slots.length, 0);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-[#ead8c6] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Dni w terminarzu
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {days.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Łączne sloty
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {slotCount}
          </p>
        </div>
        <div className="rounded-[24px] border border-[#ead8c6] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Domyślny stan
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-900">
            Brak terminów bez wpisów
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#ead8c6] bg-white shadow-[0_18px_50px_rgba(166,130,95,0.12)]">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b4a]">
            Terminarz
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            Dostępność kalendarza
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Klient zobaczy tylko te terminy, które dodasz tutaj. Jeśli dzień nie ma
            slotów, pozostaje pusty i oznaczony jako niedostępny.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <ScheduleManager days={days} />
        </div>
      </div>
    </section>
  );
}
