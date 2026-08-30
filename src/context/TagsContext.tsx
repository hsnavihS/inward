// react
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

// types
import type { Tag } from "../types/Tag";

// context
import { useVault } from "./VaultContext";

// utilities
import { encryptAndSave, loadAndDecrypt } from "../storage";
import { pushTags, pullTags } from "../sync";

const TAGS_KEY = "tags";

interface TagsContext {
  tags: Tag[];
  addTag: (name: string) => Tag | null;
  searchTags: (query: string) => Tag[];
  replaceTags: (tags: Tag[]) => void;
}

const Ctx = createContext<TagsContext | null>(null);

export function useTags(): TagsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTags must be used within TagsProvider");
  return ctx;
}

export function TagsProvider({ children }: { children: ReactNode }) {
  const { key, vaultId } = useVault();
  const [tags, setTags] = useState<Tag[]>([]);

  // Load tags: indexedDb first, then merge with Firestore
  useEffect(() => {
    (async () => {
      try {
        const local = (await loadAndDecrypt<Tag[]>(TAGS_KEY, key)) ?? [];
        setTags(local);

        const remote = await pullTags<Tag[]>(vaultId, key);
        if (remote && remote.length > 0) {
          const localNames = new Set(local.map((t) => t.name));
          const merged = [...local, ...remote.filter((t) => !localNames.has(t.name))];
          if (merged.length > local.length) {
            setTags(merged);
            await encryptAndSave(TAGS_KEY, merged, key);
          }
        }
      } catch (err) {
        console.error("Failed to load tags:", err);
      }
    })();
  }, [key, vaultId]);

  const persistTags = (updated: Tag[]) => {
    setTags(updated);
    encryptAndSave(TAGS_KEY, updated, key).catch((err) =>
      console.error("Failed to save tags:", err)
    );
    pushTags(vaultId, updated, key).catch((err) =>
      console.error("Failed to sync tags:", err)
    );
  };

  const addTag = useCallback((name: string): Tag | null => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return null;

    const existing = tags.find((t) => t.name === normalized);
    if (existing) return existing;

    const tag: Tag = { name: normalized, createdAt: Date.now() };
    persistTags([...tags, tag]);
    return tag;
  }, [tags, key, vaultId]);

  const searchTags = useCallback((query: string): Tag[] => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.includes(q));
  }, [tags]);

  const replaceTags = useCallback((newTags: Tag[]) => {
    setTags(newTags);
  }, []);

  return (
    <Ctx.Provider value={{ tags, addTag, searchTags, replaceTags }}>
      {children}
    </Ctx.Provider>
  );
}
