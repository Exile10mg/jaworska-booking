import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { legalDocuments } from "@/db/schema";
import { type LegalDocumentKey } from "@/lib/default-legal-documents";
import { getLegalDocumentsList } from "@/lib/legal-documents";

import { LegalDocumentsManager } from "./legal-documents-manager";

export const dynamic = "force-dynamic";

function formatDateLabel(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminDocumentsPage() {
  const documents = await getLegalDocumentsList();

  let updatedAtMap: Partial<Record<LegalDocumentKey, Date>> = {};

  try {
    const db = getDb();
    const rows = await db
      .select({
        key: legalDocuments.key,
        updatedAt: legalDocuments.updatedAt,
      })
      .from(legalDocuments)
      .orderBy(asc(legalDocuments.key));

    updatedAtMap = rows.reduce<Partial<Record<LegalDocumentKey, Date>>>(
      (accumulator, row) => {
        accumulator[row.key as LegalDocumentKey] = row.updatedAt;
        return accumulator;
      },
      {},
    );
  } catch (error) {
    console.error("Admin documents page metadata error:", error);
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-[#ead8c6] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Dokumenty
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {documents.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-[#ead8c6] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Na stronie
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">2</p>
        </div>
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Gotowe do edycji
          </p>
          <p className="mt-3 text-4xl font-semibold text-stone-900">
            {documents.filter((document) => document.content.trim().length > 0).length}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#ead8c6] bg-white shadow-[0_18px_50px_rgba(166,130,95,0.12)]">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b4a]">
            Polityka prywatności i regulamin
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            Treści dokumentów do modali
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            W tym miejscu wklejasz finalne treści, które pojawiają się po kliknięciu
            w Regulamin i Politykę Prywatności na stronie rezerwacji.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <LegalDocumentsManager
            documents={documents.map((document) => ({
              ...document,
              updatedAtLabel: formatDateLabel(updatedAtMap[document.key] ?? null),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
