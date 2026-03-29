"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  PencilLine,
} from "lucide-react";

import {
  initialAdminActionState,
  type AdminActionState,
} from "@/app/admin/action-state";
import { updateBookingDetailsAction } from "@/app/admin/actions";

type ServiceOption = {
  id: string;
  name: string;
  price: number;
};

type AvailabilityDay = {
  date: string;
  slots: string[];
};

type BookingEditData = {
  id: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
};

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function ActionNotice({ state }: { state: AdminActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isSuccess = state.status === "success";

  return (
    <p
      className={[
        "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm",
        isSuccess
          ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{state.message}</span>
    </p>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
    >
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Zapisywanie...
        </>
      ) : (
        "Zapisz zmiany"
      )}
    </button>
  );
}

export function EditBookingForm({
  booking,
  services,
  availabilityDays,
}: {
  booking: BookingEditData;
  services: ServiceOption[];
  availabilityDays: AvailabilityDay[];
}) {
  const [state, formAction] = useActionState(
    updateBookingDetailsAction,
    initialAdminActionState,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(booking.appointmentDate);

  const dateOptions = useMemo(() => {
    const map = new Map<string, AvailabilityDay>();

    for (const day of availabilityDays) {
      map.set(day.date, day);
    }

    if (!map.has(booking.appointmentDate)) {
      map.set(booking.appointmentDate, {
        date: booking.appointmentDate,
        slots: [],
      });
    }

    return Array.from(map.values()).sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }, [availabilityDays, booking.appointmentDate]);

  const selectedDateEntry =
    dateOptions.find((day) => day.date === selectedDate) ?? null;

  const timeOptions = useMemo(() => {
    const slots = [...(selectedDateEntry?.slots ?? [])];

    if (
      selectedDate === booking.appointmentDate &&
      !slots.includes(booking.appointmentTime)
    ) {
      slots.unshift(booking.appointmentTime);
    }

    return Array.from(new Set(slots)).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [
    booking.appointmentDate,
    booking.appointmentTime,
    selectedDate,
    selectedDateEntry,
  ]);

  return (
    <div className="mt-4 border-t border-stone-200 pt-4">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
      >
        <PencilLine className="h-4 w-4" />
        Edytuj wizytę
        <ChevronDown
          className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <form action={formAction} className="mt-4 space-y-4 rounded-[24px] border border-stone-200 bg-white p-4">
          <input type="hidden" name="bookingId" value={booking.id} />

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Imię i nazwisko
              </label>
              <input
                name="customerName"
                defaultValue={booking.customerName}
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Numer telefonu
              </label>
              <input
                name="customerPhone"
                defaultValue={booking.customerPhone}
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Usługa
              </label>
              <select
                name="serviceId"
                defaultValue={booking.serviceId}
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.price} zł
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Data wizyty
              </label>
              <select
                name="appointmentDate"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              >
                {dateOptions.map((day) => (
                  <option key={day.date} value={day.date}>
                    {formatDateLabel(day.date)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Godzina wizyty
              </label>
              <select
                name="appointmentTime"
                defaultValue={
                  selectedDate === booking.appointmentDate
                    ? booking.appointmentTime
                    : timeOptions[0]
                }
                key={`${booking.id}-${selectedDate}`}
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                    {time === booking.appointmentTime &&
                    selectedDate === booking.appointmentDate
                      ? " (aktualny)"
                      : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500">
                Pokazujemy tylko wolne terminy oraz aktualny slot tej rezerwacji.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Uwagi
            </label>
            <textarea
              name="notes"
              defaultValue={booking.notes}
              rows={3}
              className="min-h-[96px] w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>

          {booking.status === "cancelled" ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Ta rezerwacja jest obecnie anulowana. Edycja danych nie rezerwuje slotu,
              dopóki nie zmienisz statusu z powrotem na oczekującą lub potwierdzoną.
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ActionNotice state={state} />
            <SaveButton />
          </div>
        </form>
      ) : null}
    </div>
  );
}
