"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Shield,
} from "lucide-react";

import {
  initialAdminActionState,
  type AdminActionState,
} from "@/app/admin/action-state";
import { updateLegalDocumentAction } from "@/app/admin/actions";
import type {
  LegalDocument,
  LegalDocumentKey,
} from "@/lib/default-legal-documents";

type LegalDocumentWithDate = LegalDocument & {
  updatedAtLabel?: string | null;
};

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
        "Zapisz dokument"
      )}
    </button>
  );
}

function getDocumentIcon(key: LegalDocumentKey) {
  return key === "regulamin" ? FileText : Shield;
}

function LegalDocumentCard({ document }: { document: LegalDocumentWithDate }) {
  const [state, formAction] = useActionState(
    updateLegalDocumentAction,
    initialAdminActionState,
  );
  const Icon = getDocumentIcon(document.key);

  return (
    <form
      action={formAction}
      className="rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,_#fffdfa,_#fff8f2)] p-5 shadow-sm"
    >
      <input type="hidden" name="key" value={document.key} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6b4a]">
            <Icon className="h-4 w-4" />
            {document.key === "regulamin" ? "Regulamin" : "Polityka prywatności"}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">
            Treść do modala na stronie
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Wklej finalną treść dokumentu. Zapis od razu podmieni zawartość modala
            na stronie rezerwacji.
          </p>
          {document.updatedAtLabel ? (
            <p className="mt-2 text-xs text-stone-500">
              Ostatnia aktualizacja: {document.updatedAtLabel}
            </p>
          ) : null}
        </div>

        <SaveButton />
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Tytuł modala
          </label>
          <input
            name="title"
            defaultValue={document.title}
            className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Treść
          </label>
          <textarea
            name="content"
            defaultValue={document.content}
            rows={14}
            className="min-h-[260px] w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-[#8c6b4a] focus:ring-4 focus:ring-[#f4e5d5]"
          />
        </div>
      </div>

      <div className="mt-4">
        <ActionNotice state={state} />
      </div>
    </form>
  );
}

export function LegalDocumentsManager({
  documents,
}: {
  documents: LegalDocumentWithDate[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {documents.map((document) => (
        <LegalDocumentCard key={document.key} document={document} />
      ))}
    </div>
  );
}
