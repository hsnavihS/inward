import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Entry } from "../types/Entry";

interface EntriesContext {
  entries: Entry[];
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
  const [entries, setEntries] = useState<Entry[]>([]);

  const addEntry = useCallback((input: Omit<Entry, "id" | "createdAt" | "updatedAt">): Entry => {
    const now = Date.now();
    const entry: Entry = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const getEntry = useCallback((id: string) => {
    return entries.find((e) => e.id === id);
  }, [entries]);

  const updateEntry = useCallback((id: string, input: Partial<Omit<Entry, "id" | "createdAt" | "updatedAt">>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...input, updatedAt: Date.now() } : e))
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ entries, addEntry, getEntry, updateEntry, deleteEntry }}>
      {children}
    </Ctx.Provider>
  );
}
