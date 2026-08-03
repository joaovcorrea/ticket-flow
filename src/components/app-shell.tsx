"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { getStoredUser } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const user = getStoredUser();
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (!user && !isAuthPage) {
      router.replace("/login");
      return;
    }

    if (user && isAuthPage) {
      router.replace("/");
      return;
    }

    setInitialized(true);
  }, [pathname, router]);

  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>;
  }

  const isPublicPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="flex min-h-screen">
      {!isPublicPage && <Sidebar />}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
