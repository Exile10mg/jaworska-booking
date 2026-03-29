import { desc } from "drizzle-orm";

import { updateBookingStatusAction } from "@/app/admin/actions";
import { getDb } from "@/db/client";
import { bookings } from "@/db/schema";

export const dynamic = "force-dynamic";

const statusMeta = {
  pending: {
    label: "Oczekuje",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700",
  },
  confirmed: {
    label: "Potwierdzona",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "Anulowana",
    badgeClass:
      "border-rose-200 bg-rose-50 text-rose-700",
  },
} as const;

function formatAdminDate(value: Date | string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: bookings.id,
      serviceName: bookings.serviceName,
      appointmentDate: bookings.appointmentDate,
      appointmentTime: bookings.appointmentTime,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      notes: bookings.notes,
      price: bookings.price,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .orderBy(desc(bookings.createdAt));

  const pendingCount = rows.filter((row) => row.status === "pending").length;
  const confirmedCount = rows.filter((row) => row.status === "confirmed").length;
  const cancelledCount = rows.filter((row) => row.status === "cancelled").length;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-[#ead8c6] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Wszystkie rezerwacje
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {rows.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Oczekujące
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Potwierdzone
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {confirmedCount}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Anulowane: {cancelledCount}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#ead8c6] bg-white shadow-[0_18px_50px_rgba(166,130,95,0.12)]">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b4a]">
            Rezerwacje
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            Aktualna lista wizyt
          </h2>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {rows.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-5 py-10 text-center text-sm text-stone-500">
              Brak rezerwacji do wyświetlenia.
            </div>
          ) : (
            rows.map((booking) => {
              const meta = statusMeta[booking.status];

              return (
                <article
                  key={booking.id}
                  className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,_#fffdfa,_#fff8f2)] p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <h3 className="text-lg font-semibold text-stone-900">
                          {booking.serviceName}
                        </h3>
                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                            Termin
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {booking.appointmentDate} o {booking.appointmentTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                            Klientka
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {booking.customerName}
                          </p>
                          <p className="text-stone-600">{booking.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                            Kwota
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {booking.price ?? 0} zł
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                            Dodano
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatAdminDate(booking.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-stone-100 bg-white/90 px-4 py-3 text-sm text-stone-600">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                          Uwagi
                        </p>
                        <p className="mt-1.5">
                          {booking.notes.trim() || "Brak dodatkowych uwag."}
                        </p>
                      </div>
                    </div>

                    <div className="lg:w-[280px]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                        Zmień status
                      </p>
                      <div className="mt-3 grid gap-2">
                        {(
                          [
                            ["pending", "Oczekuje"],
                            ["confirmed", "Potwierdź"],
                            ["cancelled", "Anuluj"],
                          ] as const
                        ).map(([status, label]) => (
                          <form key={status} action={updateBookingStatusAction}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="status" value={status} />
                            <button
                              type="submit"
                              disabled={booking.status === status}
                              className="flex h-11 w-full items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-default disabled:border-[#8c6b4a] disabled:bg-[#8c6b4a] disabled:text-white"
                            >
                              {label}
                            </button>
                          </form>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
