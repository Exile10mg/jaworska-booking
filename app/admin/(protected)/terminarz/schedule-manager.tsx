"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";

import {
  createAvailabilitySlotAction,
  deleteAvailabilityDayAction,
  deleteAvailabilitySlotAction,
} from "@/app/admin/actions";
import {
  initialAdminActionState,
  type AdminActionState,
} from "@/app/admin/action-state";

type AvailabilityDay = {
  date: string;
  slots: string[];
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

function PrimarySubmitButton() {
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
          Dodawanie...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj godzinę
        </>
      )}
    </button>
  );
}

function DeleteDayButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Usuwanie...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń dzień
        </>
      )}
    </button>
  );
}

function DeleteSlotButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-full border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
          Usuwanie...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Usuń
        </>
      )}
    </button>
  );
}

function CreateAvailabilityCard() {
  const [state, formAction] = useActionState(
    createAvailabilitySlotAction,
    initialAdminActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-[24px] border border-dashed border-[#d9c0a7] bg-[#fffaf5] p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c6b4a]">
            Nowy slot
          </p>
          <h3 className="mt-1 text-xl font-semibold text-stone-900">
            Dodaj pojedynczą godzinę do grafiku
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Wybierz datę i konkretną godzinę, a slot od razu trafi do
            terminarza klienta.
          </p>
        </div>
        <PrimarySubmitButton />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Data
          </label>
          <input
            name="date"
            type="date"
            className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Godzina
          </label>
          <input
            name="time"
            type="time"
            defaultValue="09:00"
            className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
          />
        </div>
      </div>

      <div className="mt-4">
        <ActionNotice state={state} />
      </div>
    </form>
  );
}

function ScheduleDayCard({ day }: { day: AvailabilityDay }) {
  const [deleteDayState, deleteDayAction] = useActionState(
    deleteAvailabilityDayAction,
    initialAdminActionState,
  );

  return (
    <article className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,_#fffdfa,_#fff8f2)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c6b4a]">
            Dzień dostępności
          </p>
          <h3 className="mt-1 text-xl font-semibold text-stone-900">
            {formatDateLabel(day.date)}
          </h3>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
            <CalendarDays className="h-3.5 w-3.5 text-[#8c6b4a]" />
            {day.slots.length}{" "}
            {day.slots.length === 1
              ? "slot"
              : day.slots.length < 5
                ? "sloty"
                : "slotów"}
          </div>
        </div>

        <div className="space-y-3">
          <form
            action={deleteDayAction}
            onSubmit={(event) => {
              if (!window.confirm(`Usunąć cały dzień ${day.date}?`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="date" value={day.date} />
            <DeleteDayButton />
          </form>
          <ActionNotice state={deleteDayState} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {day.slots.map((time) => (
          <SlotChip key={`${day.date}-${time}`} date={day.date} time={time} />
        ))}
      </div>
    </article>
  );
}

function SlotChip({ date, time }: { date: string; time: string }) {
  const [state, action] = useActionState(
    deleteAvailabilitySlotAction,
    initialAdminActionState,
  );

  return (
    <div className="space-y-2">
      <form action={action}>
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={time} />
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-stone-800">
            <Clock3 className="h-3.5 w-3.5 text-[#8c6b4a]" />
            {time}
          </span>
          <DeleteSlotButton />
        </div>
      </form>
      <ActionNotice state={state} />
    </div>
  );
}

export function ScheduleManager({ days }: { days: AvailabilityDay[] }) {
  return (
    <div className="space-y-4">
      <CreateAvailabilityCard />

      {days.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-5 py-10 text-center text-sm text-stone-500">
          Na razie nie ma żadnych dodanych dni w terminarzu.
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <ScheduleDayCard key={day.date} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}
