import { NextResponse } from "next/server";

import { getLegalDocumentsMap } from "@/lib/legal-documents";

export async function GET() {
  const documents = await getLegalDocumentsMap();

  return NextResponse.json({
    documents,
  });
}
