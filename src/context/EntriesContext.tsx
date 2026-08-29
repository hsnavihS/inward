// react
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

// types
import type { Entry } from "../types/Entry";

// context
import { useVault } from "./VaultContext";

// utilities
import { encryptAndSave, loadAndDecrypt } from "../storage";

const ENTRIES_KEY = "entries";

interface EntriesContext {
  entries: Entry[];
  loading: boolean;
  error: string;
  addEntry: (input: Omit<Entry, "id" | "createdAt" | "updatedAt">) => Entry;
  getEntry: (id: string) => Entry | undefined;
  updateEntry: (id: string, input: Partial<Omit<Entry, "id" | "createdAt" | "updatedAt">>) => void;
  deleteEntry: (id: string) => void;
}

const Ctx = createContext<EntriesContext | null>(null);

export function useEntries(): EntriesContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEntries must be used within EntriesProvider");
  return ctx;
}

export function EntriesProvider({ children }: { children: ReactNode }) {
  const { key } = useVault();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load entries on boot
  useEffect(() => {
    loadAndDecrypt<Entry[]>(ENTRIES_KEY, key)
      .then((data) => setEntries(data ?? []))
      .catch((err) => setError("Failed to load entries: " + err.message))
      .finally(() => setLoading(false));
  }, [key]);

  const persistAndSet = (updated: Entry[]) => {
    setEntries(updated);
    encryptAndSave(ENTRIES_KEY, updated, key).catch((err) =>
      console.error("Failed to save entries:", err)
    );
  };

  const addEntry = useCallback((input: Omit<Entry, "id" | "createdAt" | "updatedAt">): Entry => {
    const now = Date.now();
    const entry: Entry = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    persistAndSet([entry, ...entries]);
    return entry;
  }, [entries, key]);

  const getEntry = useCallback((id: string) => {
    return entries.find((e) => e.id === id);
  }, [entries]);

  const updateEntry = useCallback((id: string, input: Partial<Omit<Entry, "id" | "createdAt" | "updatedAt">>) => {
    persistAndSet(entries.map((e) => (e.id === id ? { ...e, ...input, updatedAt: Date.now() } : e)));
  }, [entries, key]);

  const deleteEntry = useCallback((id: string) => {
    persistAndSet(entries.filter((e) => e.id !== id));
  }, [entries, key]);

  return (
    <Ctx.Provider value={{ entries, loading, error, addEntry, getEntry, updateEntry, deleteEntry }}>
      {children}
    </Ctx.Provider>
  );
}
