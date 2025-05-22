"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";

// Import dynamique pour éviter les soucis SSR avec react-big-calendar
const AgendaCalendar = dynamic(() => import("./AgendaCalendar"), { ssr: false });

const getToken = (): string | null => {
  const tokenCookie = Cookies.get("authTokens");
  if (!tokenCookie) return null;
  try {
    const tokenData = JSON.parse(tokenCookie);
    return tokenData.access;
  } catch {
    console.error("Impossible de lire les informations de session.");
    return null;
  }
};

export default function AgendasPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getToken());
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {token ? (
          <AgendaCalendar token={token} />
        ) : (
          <div className="text-red-600 dark:text-red-300">Veuillez vous connecter pour voir l&apos;agenda.</div>
        )}
      </div>
    </div>
  );
}