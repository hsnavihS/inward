// react
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

// types
import type { Entry } from "../types/Entry";

// context
import { useVault } from "./VaultContext";

// utilities
import { encryptAndSave, loadAndDecrypt } from "../storage";
import { pushEntry, pullEntries, deleteRemoteEntry, mergeEntries } from "../sync";

const ENTRIES_KEY = "entries";

interface EntriesContext {
  entries: Entry[];
  loading: boolean;
  error: string;
  addEntry: (input: Omit<Entry, "id" | "createdAt" | "updatedAt">) => Entry;
  getEntry: (id: string) => Entry | undefined;
  updateEntry: (id: string, input: Partial<Omit<Entry, "id" | "createdAt" | "updatedAt">>) => void;
  deleteEntry: (id: string) => void;
  removeTagFromAll: (tagName: string) => void;
  replaceEntries: (entries: Entry[]) => void;
}

const Ctx = createContext<EntriesContext | null>(null);

export function useEntries(): EntriesContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEntries must be used within EntriesProvider");
  return ctx;
}

export function EntriesProvider({ children }: { children: ReactNode }) {
  const { key, vaultId } = useVault();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load entries: indexedDb first, then merge with Firestore
  useEffect(() => {
    (async () => {
      try {
        const local = (await loadAndDecrypt<Entry[]>(ENTRIES_KEY, key)) ?? [];
        setEntries(local);

        const remote = await pullEntries<Entry>(vaultId, key);
        if (remote.length > 0) {
          const merged = mergeEntries(local, remote);
          setEntries(merged);
          await encryptAndSave(ENTRIES_KEY, merged, key);
        }
      } catch (err) {
        setError("Failed to load entries: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [key, vaultId]);

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
    pushEntry(vaultId, entry, key).catch((err) =>
      console.error("Failed to sync entry:", err)
    );
    return entry;
  }, [entries, key, vaultId]);

  const getEntry = useCallback((id: string) => {
    return entries.find((e) => e.id === id);
  }, [entries]);

  const updateEntry = useCallback((id: string, input: Partial<Omit<Entry, "id" | "createdAt" | "updatedAt">>) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, ...input, updatedAt: Date.now() } : e));
    persistAndSet(updated);
    const entry = updated.find((e) => e.id === id);
    if (entry) {
      pushEntry(vaultId, entry, key).catch((err) =>
        console.error("Failed to sync entry:", err)
      );
    }
  }, [entries, key, vaultId]);

  const deleteEntry = useCallback((id: string) => {
    persistAndSet(entries.filter((e) => e.id !== id));
    deleteRemoteEntry(vaultId, id).catch((err) =>
      console.error("Failed to delete remote entry:", err)
    );
  }, [entries, key, vaultId]);

  const removeTagFromAll = useCallback((tagName: string) => {
    const updated = entries.map((e) =>
      e.tags.some((t) => t.name === tagName)
        ? { ...e, tags: e.tags.filter((t) => t.name !== tagName), updatedAt: Date.now() }
        : e
    );
    persistAndSet(updated);
    // Sync affected entries
    for (const entry of updated) {
      if (!entries.find((e) => e.id === entry.id && e.updatedAt === entry.updatedAt)) {
        pushEntry(vaultId, entry, key).catch((err) =>
          console.error("Failed to sync entry:", err)
        );
      }
    }
  }, [entries, key, vaultId]);

  const replaceEntries = useCallback((newEntries: Entry[]) => {
    setEntries(newEntries);
  }, []);

  return (
    <Ctx.Provider value={{ entries, loading, error, addEntry, getEntry, updateEntry, deleteEntry, removeTagFromAll, replaceEntries }}>
      {children}
    </Ctx.Provider>
  );
}
