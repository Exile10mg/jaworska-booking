"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navClass(isActive: boolean) {
  return isActive
    ? "border-[#8c6b4a] bg-[#8c6b4a] text-white shadow-sm"
    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50";
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/admin/rezerwacje"
        className={`inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-medium transition ${navClass(
          pathname.startsWith("/admin/rezerwacje"),
        )}`}
      >
        Rezerwacje
      </Link>
      <Link
        href="/admin/uslugi"
        className={`inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-medium transition ${navClass(
          pathname.startsWith("/admin/uslugi"),
        )}`}
      >
        Usługi
      </Link>
    </nav>
  );
}
