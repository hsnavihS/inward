// react
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

// types
import type { Tag } from "../types/Tag";

// context
import { useVault } from "./VaultContext";

// utilities
import { encryptAndSave, loadAndDecrypt } from "../storage";

const TAGS_KEY = "tags";

interface TagsContext {
  tags: Tag[];
  addTag: (name: string) => Tag | null;
  searchTags: (query: string) => Tag[];
}

const Ctx = createContext<TagsContext | null>(null);

export function useTags(): TagsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTags must be used within TagsProvider");
  return ctx;
}

export function TagsProvider({ children }: { children: ReactNode }) {
  const { key } = useVault();
  const [tags, setTags] = useState<Tag[]>([]);

  // Load tags on boot
  useEffect(() => {
    loadAndDecrypt<Tag[]>(TAGS_KEY, key)
      .then((data) => setTags(data ?? []))
      .catch((err) => console.error("Failed to load tags:", err));
  }, [key]);

  const addTag = useCallback((name: string): Tag | null => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return null;

    const existing = tags.find((t) => t.name === normalized);
    if (existing) return existing;

    const tag: Tag = { name: normalized, createdAt: Date.now() };
    const updated = [...tags, tag];
    setTags(updated);
    encryptAndSave(TAGS_KEY, updated, key).catch((err) =>
      console.error("Failed to save tags:", err)
    );
    return tag;
  }, [tags, key]);

  const searchTags = useCallback((query: string): Tag[] => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.includes(q));
  }, [tags]);

  return (
    <Ctx.Provider value={{ tags, addTag, searchTags }}>
      {children}
    </Ctx.Provider>
  );
}
