import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Tag } from "../types/Tag";

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
  const [tags, setTags] = useState<Tag[]>([]);

  const addTag = useCallback((name: string): Tag | null => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return null;

    const existing = tags.find((t) => t.name === normalized);
    if (existing) return existing;

    const tag: Tag = { name: normalized, createdAt: Date.now() };
    setTags((prev) => [...prev, tag]);
    return tag;
  }, [tags]);

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
