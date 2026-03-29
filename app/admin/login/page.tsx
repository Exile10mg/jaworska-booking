import { redirect } from "next/navigation";

import { LoginForm } from "@/app/admin/login/login-form";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getAuthenticatedAdmin();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8f3ed,_#fcfaf8)] px-4 py-10 text-stone-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#ead8c6] bg-white shadow-[0_30px_90px_rgba(166,130,95,0.18)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-[radial-gradient(circle_at_top,_rgba(199,153,99,0.28),_transparent_50%),linear-gradient(180deg,_#fff8f1,_#fffdf9)] p-10 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6b4a]">
              Panel administracyjny
            </p>
            <h1 className="mt-4 max-w-sm font-serif text-5xl leading-tight text-stone-900">
              Jaworska Beauty
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-stone-600">
              Zaloguj się, aby zarządzać rezerwacjami, potwierdzać wizyty i
              przygotować panel pod blokowanie terminów.
            </p>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6b4a]">
                Logowanie
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-stone-900">
                Wejście do panelu admina
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Użyj konta administratora, aby zobaczyć wszystkie rezerwacje i
                zmieniać ich status.
              </p>

              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
