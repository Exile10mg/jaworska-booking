import "server-only";

import { getDb } from "@/db/client";
import { legalDocuments } from "@/db/schema";
import {
  defaultLegalDocuments,
  legalDocumentKeys,
  type LegalDocument,
  type LegalDocumentKey,
} from "@/lib/default-legal-documents";

function cloneDefaultDocuments() {
  return structuredClone(defaultLegalDocuments);
}

export async function getLegalDocumentsMap(): Promise<
  Record<LegalDocumentKey, LegalDocument>
> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        key: legalDocuments.key,
        title: legalDocuments.title,
        content: legalDocuments.content,
      })
      .from(legalDocuments);

    const documents = cloneDefaultDocuments();

    for (const row of rows) {
      if (!legalDocumentKeys.includes(row.key as LegalDocumentKey)) {
        continue;
      }

      const key = row.key as LegalDocumentKey;
      documents[key] = {
        key,
        title: row.title,
        content: row.content,
      };
    }

    return documents;
  } catch (error) {
    console.error("getLegalDocumentsMap error:", error);
    return cloneDefaultDocuments();
  }
}

export async function getLegalDocumentsList() {
  const documents = await getLegalDocumentsMap();
  return legalDocumentKeys.map((key) => documents[key]);
}
