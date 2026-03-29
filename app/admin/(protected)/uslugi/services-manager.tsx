"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Grip,
  LoaderCircle,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";

import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/app/admin/actions";
import {
  initialServiceActionState,
  type ServiceActionState,
} from "@/app/admin/service-action-state";

type AdminService = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  sortOrder: number;
  isFixedPrice: boolean;
  isActive: boolean;
};

function ActionNotice({ state }: { state: ServiceActionState }) {
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

function MetaPill({
  icon,
  label,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  tone?: "neutral" | "accent" | "success";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "accent"
        ? "border-[#ead8c6] bg-[#fff7ef] text-[#8c6b4a]"
        : "border-stone-200 bg-white text-stone-600";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${toneClassName}`}
    >
      {icon}
      {label}
    </span>
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

function CreateButton() {
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
          Dodaj usługę
        </>
      )}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Usuwanie...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń usługę
        </>
      )}
    </button>
  );
}

function ServiceEditorCard({ service }: { service: AdminService }) {
  const [updateState, updateAction] = useActionState(
    updateServiceAction,
    initialServiceActionState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteServiceAction,
    initialServiceActionState,
  );

  return (
    <article className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,_#fffdfa,_#fff8f2)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full border border-stone-200 bg-white px-3 py-1.5 font-mono text-xs text-stone-700">
              {service.id}
            </p>
            <MetaPill
              icon={service.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              label={service.isActive ? "Widoczna w rezerwacji" : "Ukryta w rezerwacji"}
              tone={service.isActive ? "success" : "neutral"}
            />
            <MetaPill
              icon={<Tag className="h-3.5 w-3.5" />}
              label={service.isFixedPrice ? "Stała cena" : "Cena od"}
              tone="accent"
            />
            <MetaPill
              icon={<Clock3 className="h-3.5 w-3.5" />}
              label={`${service.duration} min`}
            />
            <MetaPill
              icon={<Grip className="h-3.5 w-3.5" />}
              label={`Kolejność ${service.sortOrder}`}
            />
          </div>

          <h3 className="mt-3 text-xl font-semibold text-stone-900">
            {service.name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Edytuj treść widoczną dla klienta oraz ustawienia tej usługi.
          </p>
        </div>

        <div className="space-y-3 xl:w-[15.5rem] xl:shrink-0">
          <form
            action={deleteAction}
            onSubmit={(event) => {
              const confirmed = window.confirm(
                `Usunąć usługę „${service.name}”?`,
              );

              if (!confirmed) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="serviceId" value={service.id} />
            <DeleteButton />
          </form>
          <ActionNotice state={deleteState} />
        </div>
      </div>

      <form action={updateAction} className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <input type="hidden" name="serviceId" value={service.id} />

        <div className="space-y-4">
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
              Opis widoczny w formularzu
            </label>
            <textarea
              name="description"
              rows={5}
              defaultValue={service.description}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[22px] border border-[#ead8c6] bg-[#fffaf5] p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c6b4a]">
              Konfiguracja
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Te ustawienia wpływają na cenę, czas i widoczność w formularzu.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                min="1"
                step="1"
                defaultValue={service.duration}
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              />
              <p className="text-xs text-stone-500">
                Możesz wpisać dowolny czas, np. 35, 50 albo 75 minut.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Kolejność na liście
              </label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={service.sortOrder}
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
              <input
                name="isFixedPrice"
                type="checkbox"
                defaultChecked={service.isFixedPrice}
                className="h-4 w-4 accent-[#8c6b4a]"
              />
              Stała cena zamiast „od”
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

          <div className="flex flex-col items-start gap-3">
            <SaveButton />
            <ActionNotice state={updateState} />
          </div>
        </div>
      </form>
    </article>
  );
}

function CreateServiceCard() {
  const [state, formAction] = useActionState(
    createServiceAction,
    initialServiceActionState,
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
            Nowa usługa
          </p>
          <h3 className="mt-1 text-xl font-semibold text-stone-900">
            Dodaj pozycję do oferty
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Zmiany po zapisaniu od razu trafią do formularza rezerwacji.
          </p>
        </div>
        <CreateButton />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-4">
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
              rows={5}
              placeholder="Krótki opis usługi widoczny w formularzu rezerwacji."
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[22px] border border-[#ead8c6] bg-white p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c6b4a]">
              Konfiguracja
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Ustaw cenę, czas i pozycję na liście.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                min="1"
                step="1"
                placeholder="30"
                className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
              />
              <p className="text-xs text-stone-500">
                Możesz wpisać dowolną liczbę minut.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
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

          <div className="grid gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
              <input
                name="isFixedPrice"
                type="checkbox"
                className="h-4 w-4 accent-[#8c6b4a]"
              />
              Stała cena zamiast „od”
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 accent-[#8c6b4a]"
              />
              Od razu pokaż w formularzu rezerwacji
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ActionNotice state={state} />
      </div>
    </form>
  );
}

export function ServicesManager({ services }: { services: AdminService[] }) {
  return (
    <div className="space-y-4">
      <CreateServiceCard />

      {services.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-5 py-10 text-center text-sm text-stone-500">
          Brak usług w bazie.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <ServiceEditorCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
