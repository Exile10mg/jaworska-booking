import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-session";

export async function getAuthenticatedAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  const db = getDb();
  const [admin] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.adminId))
    .limit(1);

  return admin ?? null;
}

export async function requireAuthenticatedAdmin() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
