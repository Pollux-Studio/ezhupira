"use client";

import { useSyncExternalStore } from "react";

/** The site language chosen with the header's தமிழ் / EN switch, kept in the browser. */
export type Language = "ta" | "en";

const KEY = "ezhupira-language";
const listeners = new Set<() => void>();

function read(): Language {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "ta";
  } catch {
    return "ta";
  }
}

export function setLanguage(language: Language) {
  try {
    localStorage.setItem(KEY, language);
  } catch {
    // Storage unavailable: the choice just won't be remembered.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other tabs in step too.
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Current language; Tamil on the server and before the browser's choice is known. */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, read, () => "ta");
}
