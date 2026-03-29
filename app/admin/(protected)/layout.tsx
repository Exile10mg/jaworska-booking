import type { ReactNode } from "react";

import { logoutAdminAction } from "@/app/admin/actions";
import { AdminNav } from "@/app/admin/(protected)/admin-nav";
import { requireAuthenticatedAdmin } from "@/lib/admin-auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAuthenticatedAdmin();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8f3ed,_#fcfaf8)] px-4 py-6 text-stone-900 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="animate-admin-shell rounded-[28px] border border-[#ead8c6] bg-white px-5 py-4 shadow-[0_18px_50px_rgba(166,130,95,0.12)] sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6b4a]">
                  Jaworska Beauty
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-stone-900">
                  Panel administracyjny
                </h1>
                <p className="mt-1 text-sm text-stone-600">
                  Zalogowano jako {admin.displayName ?? admin.email}
                </p>
              </div>

              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  Wyloguj
                </button>
              </form>
            </div>

            <AdminNav />
          </div>
        </header>

        <div className="animate-admin-content">{children}</div>
      </div>
    </main>
  );
}
