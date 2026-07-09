"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "openshield-sidebar-collapsed";

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // Check if user is logged in by looking for the sidebar state
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setHasSession(true);
      if (stored === "true") setCollapsed(true);
    }

    const handleCustom = (e: CustomEvent) => {
      if (!mountedRef.current) return;
      setHasSession(true);
      setCollapsed(e.detail);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setHasSession(true);
        setCollapsed(e.newValue === "true");
      }
    };

    // Use setTimeout to defer the listener registration so we don't
    // receive events dispatched during the same render cycle
    const raf = requestAnimationFrame(() => {
      window.addEventListener("sidebar-toggle", handleCustom as EventListener);
      window.addEventListener("storage", handleStorage);
    });

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("sidebar-toggle", handleCustom as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Public pages (login, register, forgot-password, reset-password) don't have sidebar
  const isPublicPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const marginLeft =
    isPublicPage || !hasSession
      ? "0px"
      : collapsed
        ? "var(--sidebar-width-collapsed)"
        : "var(--sidebar-width-expanded)";

  return (
    <main
      className="flex-1 min-h-screen transition-all duration-300 ease-in-out"
      style={{ marginLeft }}
    >
      {children}
    </main>
  );
}